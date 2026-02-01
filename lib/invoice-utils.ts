import { invoiceConfig } from './shop-config';

export function generateItemId(): string {
    return Math.random().toString(36).substring(2, 9);
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
        FAILED: 'bg-red-100 text-red-800',
        PENDING: 'bg-yellow-100 text-yellow-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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
