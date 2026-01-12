import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { InvoicePDF } from '@/components/invoice-pdf';
import { InvoiceWithRelations } from '@/types/invoice';
import { shopConfig } from '@/lib/shop-config';
import { generateQRCode, generatePaymentString } from '@/lib/qr';

export async function POST(request: NextRequest) {
    try {
        const invoice: InvoiceWithRelations = await request.json();

        if (!invoice) {
            return NextResponse.json(
                { error: 'Geen factuurgegevens' },
                { status: 400 }
            );
        }

        // Generate QR Code
        const qrCodeUrl = await generateQRCode(
            generatePaymentString(invoice.total, invoice.invoiceNumber, shopConfig.bankAccount, shopConfig.name)
        );

        // Generate PDF
        const pdfBuffer = await renderToBuffer(InvoicePDF({ invoice, qrCodeUrl }));

        // Return PDF as download
        return new NextResponse(new Uint8Array(pdfBuffer), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Factuur-${invoice.invoiceNumber}.pdf"`,
            },
        });
    } catch (error) {
        console.error('Generate PDF error:', error);
        return NextResponse.json(
            { error: 'Kon PDF niet genereren' },
            { status: 500 }
        );
    }
}
