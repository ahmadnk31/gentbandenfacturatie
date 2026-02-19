import QRCode from 'qrcode';

export async function generateQRCode(text: string): Promise<string> {
    try {
        return await QRCode.toDataURL(text, {
            errorCorrectionLevel: 'M',
            margin: 1,
            width: 200,
            color: {
                dark: '#000000',
                light: '#ffffff',
            },
        });
    } catch (err) {
        console.error('Error generating QR code:', err);
        return '';
    }
}

export function generatePaymentString(
    total: number,
    invoiceNumber: string,
    iban: string,
    name: string
): string {
    const cleanIban = iban.replace('IBAN:', '').replace(/\s/g, '').toUpperCase();
    const amount = `EUR${total.toFixed(2)}`;
    const beneficiaryName = name
        .trim()
        .replace(/\s+/g, ' ')
        .slice(0, 70);
    const remittance = `Factuur ${invoiceNumber}`.trim().slice(0, 140);

    // EPC-QR Code Standard (Version 002)
    // Service Tag
    // Version
    // Character Set (1 = UTF-8)
    // Identification
    // BIC (Optional)
    // Name
    // IBAN
    // Amount
    // Purpose (Optional)
    // Remittance Reference (Structured - Optional)
    // Remittance Information (Unstructured)

    const epcLines = [
        'BCD',
        '002',
        '1',
        'SCT',
        '',
        beneficiaryName,
        cleanIban,
        amount,
        '',
        '',
        remittance,
    ];

    return `${epcLines.join('\r\n')}\r\n`;
}
