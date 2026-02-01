'use server';

import prisma from './prisma';
import { CreateInvoiceInput, InvoiceWithRelations } from '@/types/invoice';
import { revalidatePath } from 'next/cache';
import { transformInvoice } from './invoice-utils';
import { Prisma } from '@/app/generated/prisma/client';

const Decimal = Prisma.Decimal;

// Generate unique invoice number: INV-YYYYMM-XXXX
async function generateInvoiceNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const prefix = `INV-${year}${month}`;

    // Find the last invoice with this prefix
    const lastInvoice = await prisma.invoice.findFirst({
        where: {
            invoiceNumber: {
                startsWith: prefix,
            },
        },
        orderBy: {
            invoiceNumber: 'desc',
        },
        select: {
            invoiceNumber: true
        }
    });

    let number = 1;
    if (lastInvoice) {
        const parts = lastInvoice.invoiceNumber.split('-');
        if (parts.length === 3) {
            const lastSequence = parseInt(parts[2], 10);
            if (!isNaN(lastSequence)) {
                number = lastSequence + 1;
            }
        }
    }

    const numberStr = String(number).padStart(4, '0');
    return `${prefix}-${numberStr}`;
}

// Create a new invoice with customer and payment
export async function createInvoice(input: CreateInvoiceInput): Promise<InvoiceWithRelations> {
    const now = new Date();

    // Calculate totals
    const subtotal = input.items.reduce((sum, item) => sum + item.total, 0);
    const vatAmount = input.items.reduce(
        (sum, item) => sum + (item.total * item.vatRate) / 100,
        0
    );
    const total = subtotal + vatAmount;

    // Create or get customer
    let customerId = input.customerId;

    if (!customerId) {
        const customer = await prisma.customer.create({
            data: {
                type: input.customerType,
                name: input.customerName,
                email: input.customerEmail || null,
                address: input.customerAddress || null,
                vatNumber: input.customerType === 'BUSINESS' ? input.customerVatNumber : null,
            },
        });
        customerId = customer.id;
    }

    // Create payment
    const payment = await prisma.payment.create({
        data: {
            customerId,
            amountTotal: new Decimal(total),
            paymentMethod: input.paymentMethod,
            status: 'PAID',
            paidAt: now,
        },
    });

    // Try to create invoice with retries for unique constraint on invoiceNumber
    let retries = 3;
    while (retries > 0) {
        try {
            // Generate invoice number
            const invoiceNumber = await generateInvoiceNumber();

            // Create invoice with items
            const invoice = await prisma.invoice.create({
                data: {
                    invoiceNumber,
                    customerId,
                    paymentId: payment.id,

                    // Add vehicle details
                    licensePlate: input.licensePlate,
                    mileage: input.mileage,
                    vehicleModel: input.vehicleModel,

                    subtotal: new Decimal(subtotal),
                    vatAmount: new Decimal(vatAmount),
                    total: new Decimal(total),
                    status: input.status,
                    issuedAt: now,
                    paidAt: now,
                    items: {
                        create: input.items.map((item) => ({
                            description: item.description,
                            size: item.size || null,
                            quantity: Number(item.quantity) || 0,
                            unitPrice: new Decimal(item.unitPrice),
                            vatRate: new Decimal(item.vatRate),
                            total: new Decimal(item.total),
                        })),
                    },
                },
                include: {
                    customer: true,
                    payment: true,
                    items: true,
                },
            });

            return transformInvoice(invoice);
        } catch (error: any) {
            // Check for unique constraint violation on invoiceNumber
            if (error.code === 'P2002' && error.meta?.target?.includes('invoiceNumber')) {
                retries--;
                if (retries === 0) {
                    // If we executed all retries and failed, delete the payment to cleanup
                    await prisma.payment.delete({ where: { id: payment.id } });
                    throw new Error(`Failed to generate unique invoice number after 3 attempts. Please try again.`);
                }
                // Wait small random amount to reduce collision chance in tight loop
                await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
                continue;
            }

            // Pending payment cleanup on other errors is a good idea too
            await prisma.payment.delete({ where: { id: payment.id } });
            throw error;
        }
    }

    throw new Error("Unexpected error in createInvoice");
}

// Update an existing invoice
export async function updateInvoice(id: string, input: CreateInvoiceInput): Promise<InvoiceWithRelations> {
    const now = new Date();

    // Get existing invoice to find paymentId
    const existingInvoice = await prisma.invoice.findUnique({
        where: { id },
        select: { paymentId: true, customerId: true }
    });

    if (!existingInvoice) {
        throw new Error('Invoice not found');
    }

    // Calculate totals
    const subtotal = input.items.reduce((sum, item) => sum + item.total, 0);
    const vatAmount = input.items.reduce(
        (sum, item) => sum + (item.total * item.vatRate) / 100,
        0
    );
    const total = subtotal + vatAmount;

    // Update customer info (if it changed)
    await prisma.customer.update({
        where: { id: existingInvoice.customerId },
        data: {
            type: input.customerType,
            name: input.customerName,
            email: input.customerEmail || null,
            address: input.customerAddress || null,
            vatNumber: input.customerType === 'BUSINESS' ? input.customerVatNumber : null,
        },
    });

    // Update payment
    await prisma.payment.update({
        where: { id: existingInvoice.paymentId },
        data: {
            amountTotal: new Decimal(total),
            paymentMethod: input.paymentMethod,
        },
    });

    // Update invoice and items
    // We delete and recreate items for simplicity
    const invoice = await prisma.invoice.update({
        where: { id },
        data: {
            // Vehicle details
            licensePlate: input.licensePlate,
            mileage: input.mileage,
            vehicleModel: input.vehicleModel,

            subtotal: new Decimal(subtotal),
            vatAmount: new Decimal(vatAmount),
            total: new Decimal(total),
            status: input.status,

            items: {
                deleteMany: {},
                create: input.items.map((item) => ({
                    description: item.description,
                    size: item.size || null,
                    quantity: Number(item.quantity) || 0,
                    unitPrice: new Decimal(item.unitPrice),
                    vatRate: new Decimal(item.vatRate),
                    total: new Decimal(item.total),
                })),
            },
        },
        include: {
            customer: true,
            payment: true,
            items: true,
        },
    });

    revalidatePath('/invoices');
    revalidatePath(`/invoices/${id}`);

    return transformInvoice(invoice);
}

// Get all invoices
export async function getAllInvoices(): Promise<InvoiceWithRelations[]> {
    const invoices = await prisma.invoice.findMany({
        include: {
            customer: true,
            payment: true,
            items: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    return invoices.map(transformInvoice);
}

// Get single invoice
export async function getInvoice(id: string): Promise<InvoiceWithRelations | null> {
    const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: {
            customer: true,
            payment: true,
            items: true,
        },
    });

    return invoice ? transformInvoice(invoice) : null;
}

// Get all customers
export async function getCustomers() {
    return prisma.customer.findMany({
        orderBy: { name: 'asc' },
    });
}

// Customer data returned when looking up by email
export interface CustomerLookupResult {
    id: string;
    type: 'PRIVATE' | 'BUSINESS';
    name: string;
    email: string | null;
    address: string | null;
    vatNumber: string | null;
    // Latest vehicle info from most recent invoice
    licensePlate: string | null;
    mileage: number | null;
    vehicleModel: string | null;
}

// Look up customer by email with their latest vehicle info
export async function getCustomerByEmail(email: string): Promise<CustomerLookupResult | null> {
    if (!email || !email.trim()) return null;

    const customer = await prisma.customer.findFirst({
        where: {
            email: {
                equals: email.trim(),
                mode: 'insensitive',
            },
        },
        include: {
            invoices: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: {
                    licensePlate: true,
                    mileage: true,
                    vehicleModel: true,
                },
            },
        },
    });

    if (!customer) return null;

    const latestInvoice = customer.invoices[0];

    return {
        id: customer.id,
        type: customer.type,
        name: customer.name,
        email: customer.email,
        address: customer.address,
        vatNumber: customer.vatNumber,
        licensePlate: latestInvoice?.licensePlate || null,
        mileage: latestInvoice?.mileage || null,
        vehicleModel: latestInvoice?.vehicleModel || null,
    };
}

// Delete invoice
export async function deleteInvoice(id: string): Promise<boolean> {
    try {
        const invoice = await prisma.invoice.findUnique({
            where: { id },
            select: { paymentId: true },
        });

        if (!invoice) return false;

        // Delete invoice (items cascade)
        await prisma.invoice.delete({ where: { id } });

        // Delete associated payment
        await prisma.payment.delete({ where: { id: invoice.paymentId } });

        revalidatePath('/invoices');
        return true;
    } catch {
        return false;
    }
}

// EU VAT Verification using VIES REST API
export async function verifyVAT(vatNumber: string) {
    // Strip all non-alphanumeric characters (spaces, dots, etc.)
    const sanitized = vatNumber.replace(/[^A-Z0-9]/gi, '');

    if (!sanitized || sanitized.length < 3) {
        throw new Error('Ongeldig BTW-nummer');
    }

    const countryCode = sanitized.substring(0, 2).toUpperCase();
    const number = sanitized.substring(2);

    try {
        // Using the simpler GET request pattern
        const response = await fetch(`https://ec.europa.eu/taxation_customs/vies/rest-api/ms/${countryCode}/vat/${number}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`VIES API Error: ${response.status} ${response.statusText}`, errorText);
            throw new Error(`VIES service niet bereikbaar (${response.status})`);
        }

        const data = await response.json();
        return {
            valid: data.isValid,
            name: data.name || '',
            address: data.address || '',
        };
    } catch (error) {
        console.error('VAT Verification Error:', error);
        throw new Error('Fout bij verifiëren van BTW-nummer');
    }
}
