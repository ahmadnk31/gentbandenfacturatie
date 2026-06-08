import { invoiceConfig } from './shop-config';
import { InvoiceWithRelations } from '@/types/invoice';

export function transformInvoice(invoice: any): InvoiceWithRelations {
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
        amountPaid: invoice.amountPaid != null ? Number(invoice.amountPaid) : null,
        status: invoice.status,
        issuedAt: invoice.issuedAt,
        paidAt: invoice.paidAt,
        createdAt: invoice.createdAt,

        paymentDeadline: invoice.paymentDeadline ?? null,
        mededeling: invoice.mededeling ?? null,
        warning: invoice.warning ?? null,
        customer: {
            id: invoice.customer.id,
            type: invoice.customer.type,
            name: invoice.customer.name,
            email: invoice.customer.email,
            address: invoice.customer.address,
            vatNumber: invoice.customer.vatNumber,
        },
        paymentMethod: invoice.payment.paymentMethod,
        items: invoice.items.map((item: any) => ({
            id: item.id,
            description: item.description,
            size: item.size,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
            vatRate: Number(item.vatRate),
            total: Number(item.total),
        })),
    };
}

export function generateItemId(): string {
    return Math.random().toString(36).substring(2, 9);
}

export function generateStructuredMededeling(): string {
    // Generate a random 10-digit number
    const random10 = Math.floor(1000000000 + Math.random() * 9000000000);
    const mod = random10 % 97;
    const checkDigits = mod === 0 ? 97 : mod;
    
    // Combine to 12 digits, padded with zeros if necessary
    const full12 = `${random10}${String(checkDigits).padStart(2, '0')}`;
    
    // Format as +++AAA/BBBB/CCCCC+++
    const part1 = full12.slice(0, 3);
    const part2 = full12.slice(3, 7);
    const part3 = full12.slice(7, 12);
    
    return `+++${part1}/${part2}/${part3}+++`;
}

export function calculateItemTotal(quantity: number | string, unitPrice: number | string): number {
    const q = typeof quantity === 'string' ? parseFloat(quantity) || 0 : quantity;
    const p = typeof unitPrice === 'string' ? parseFloat(unitPrice) || 0 : unitPrice;
    return q * p;
}

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('nl-NL', {
        style: 'currency',
        currency: invoiceConfig.currency,
    }).format(amount);
}

export function formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('nl-NL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

export function getStatusColor(status: string): string {
    const colors: Record<string, string> = {
        PAID: 'bg-green-100 text-green-800',
        UNPAID: 'bg-red-100 text-red-800',
        FAILED: 'bg-red-100 text-red-800',
        PENDING: 'bg-yellow-100 text-yellow-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
        PAID: 'Betaald',
        UNPAID: 'Niet Betaald',
    };
    return labels[status] || status;
}

// Common VAT rates in NL/BE
export const VAT_RATES = [
    { value: 21, label: '21% (Standaard)' },
    { value: 9, label: '9% (Laag tarief)' },
    { value: 0, label: '0% (Vrijgesteld)' },
];

export function getPaymentMethodLabel(method: string): string {
    const labels: Record<string, string> = {
        CASH: 'Contant',
        PIN: 'PIN',
        ONLINE: 'Online',
    };
    return labels[method] || method;
}
