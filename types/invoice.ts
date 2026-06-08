

// Form data types for creating invoices
export interface InvoiceItemInput {
    id: string;
    description: string;
    size?: string;
    quantity: number | string;
    unitPrice: number | string;
    vatRate: number;
    total: number;
}

export interface CreateInvoiceInput {
    // Customer info
    customerId?: string; // existing customer
    customerType: 'PRIVATE' | 'BUSINESS';
    customerName: string;
    customerEmail?: string;
    customerAddress?: string;
    customerVatNumber?: string;

    // Payment info
    paymentMethod: 'CASH' | 'PIN' | 'ONLINE';
    status: 'PAID' | 'UNPAID';
    amountPaid?: number;

    // Invoice items
    items: InvoiceItemInput[];

    // Vehicle Details
    licensePlate?: string;
    mileage?: number;
    vehicleModel?: string;
    // Invoice timing
    issuedAt?: Date;

    // Payment details
    paymentDeadline?: Date;
    mededeling?: string;
    warning?: string;
}

// Computed invoice with all relations
export interface InvoiceWithRelations {
    id: string;
    invoiceNumber: string;
    customerId: string;
    paymentId: string;

    // Vehicle Details
    licensePlate?: string | null;
    mileage?: number | null;
    vehicleModel?: string | null;

    subtotal: number;
    vatAmount: number;
    total: number;
    amountPaid?: number | null;
    status: 'PAID' | 'UNPAID';
    issuedAt: Date;
    paidAt: Date;
    createdAt: Date;

    paymentDeadline?: Date | null;
    mededeling?: string | null;
    warning?: string | null;
    customer: {
        id: string;
        type: 'PRIVATE' | 'BUSINESS';
        name: string;
        email: string | null;
        address: string | null;
        vatNumber: string | null;
    };
    paymentMethod: 'CASH' | 'PIN' | 'ONLINE';
    items: {
        id: string;
        description: string;
        size: string | null;
        quantity: number;
        unitPrice: number;
        vatRate: number;
        total: number;
    }[];
}
