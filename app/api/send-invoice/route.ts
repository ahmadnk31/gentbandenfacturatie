import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { resend, fromEmail } from '@/lib/resend';
import { InvoiceEmail } from '@/emails/invoice-email';
import { InvoicePDF } from '@/components/invoice-pdf';
import { InvoiceWithRelations } from '@/types/invoice';
import { shopConfig } from '@/lib/shop-config';
import { generateQRCode, generatePaymentString } from '@/lib/qr';
import { getLogoDataUrl } from '@/lib/logo';

export async function POST(request: NextRequest) {
    try {
        const invoice: InvoiceWithRelations = await request.json();

        if (!invoice || !invoice.customer?.email) {
            return NextResponse.json(
                { error: 'Geen e-mailadres beschikbaar' },
                { status: 400 }
            );
        }

        // Generate QR Code
        const qrCodeUrl = await generateQRCode(
            generatePaymentString(invoice.total, invoice.invoiceNumber, shopConfig.bankAccount, shopConfig.owner)
        );

        // Get logo data URL
        const logoUrl = await getLogoDataUrl();

        // Generate PDF
        const pdfBuffer = await renderToBuffer(InvoicePDF({ invoice, qrCodeUrl, logoUrl }));
        const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');

        // Send email with PDF attachment
        const { data, error } = await resend.emails.send({
            from: `${shopConfig.name} <${fromEmail}>`,
            to: invoice.customer.email,
            subject: `Factuur #${invoice.invoiceNumber} - ${shopConfig.name}`,
            react: InvoiceEmail({ invoice }),
            attachments: [
                {
                    filename: `Factuur-${invoice.invoiceNumber}.pdf`,
                    content: pdfBase64,
                },
            ],
        });

        if (error) {
            console.error('Resend error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            messageId: data?.id,
            message: `Factuur met PDF verzonden naar ${invoice.customer.email}`,
        });
    } catch (error) {
        console.error('Send invoice error:', error);
        return NextResponse.json(
            { error: 'Kon factuur niet verzenden' },
            { status: 500 }
        );
    }
}
