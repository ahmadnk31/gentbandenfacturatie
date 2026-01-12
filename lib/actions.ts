'use server';


import { CreateInvoiceInput, InvoiceWithRelations } from '@/types/invoice';
import { Decimal } from '@prisma/client/runtime/index-browser';
import prisma from './prisma';

// Generate unique invoice number: INV-YYYYMM-XXXX
async function generateInvoiceNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const prefix = `INV-${year}${month}`;

    // Get count of invoices this month
    const count = await prisma.invoice.count({
        where: {
            invoiceNumber: {
                startsWith: prefix,
            },
        },
    });

    const number = String(count + 1).padStart(4, '0');
    return `${prefix}-${number}`;
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
            status: 'PAID',
            issuedAt: now,
            paidAt: now,
            items: {
                create: input.items.map((item) => ({
                    description: item.description,
                    quantity: Number(item.quantity) || 0,
                    unitPrice: new Decimal(item.unitPrice),
                    vatRate: new Decimal(item.vatRate),
                    total: new Decimal(item.total),
                })),
            },
        },
        include: {
            customer: true,
            items: true,
        },
    });

    return transformInvoice(invoice);
}

// Get all invoices
export async function getAllInvoices(): Promise<InvoiceWithRelations[]> {
    const invoices = await prisma.invoice.findMany({
        include: {
            customer: true,
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

        return true;
    } catch {
        return false;
    }
}

// Transform Prisma result to plain object with numbers
function transformInvoice(invoice: any): InvoiceWithRelations {
    return {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customerId: invoice.customerId,
        paymentId: invoice.paymentId,

        // Vehicle Details
        licensePlate: invoice.licensePlate,
        mileage: invoice.mileage,
        vehicleModel: invoice.vehicleModel,

        subtotal: Number(invoice.subtotal),
        vatAmount: Number(invoice.vatAmount),
        total: Number(invoice.total),
        status: invoice.status,
        issuedAt: invoice.issuedAt,
        paidAt: invoice.paidAt,
        createdAt: invoice.createdAt,
        customer: {
            id: invoice.customer.id,
            type: invoice.customer.type,
            name: invoice.customer.name,
            email: invoice.customer.email,
            address: invoice.customer.address,
            vatNumber: invoice.customer.vatNumber,
        },
        items: invoice.items.map((item: any) => ({
            id: item.id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
            vatRate: Number(item.vatRate),
            total: Number(item.total),
        })),
    };
}
