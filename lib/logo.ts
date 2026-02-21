import fs from 'fs';
import path from 'path';

export async function getLogoDataUrl(): Promise<string> {
    try {
        const logoPath = path.join(process.cwd(), 'public', 'logo.png');

        if (!fs.existsSync(logoPath)) {
            console.warn('Logo file not found at:', logoPath);
            return '';
        }

        const logoBuffer = fs.readFileSync(logoPath);

        // Detect actual image type from magic bytes
        let mimeType = 'image/png';
        if (logoBuffer[0] === 0xFF && logoBuffer[1] === 0xD8) {
            mimeType = 'image/jpeg';
        } else if (logoBuffer[0] === 0x89 && logoBuffer[1] === 0x50) {
            mimeType = 'image/png';
        }

        const logoBase64 = logoBuffer.toString('base64');
        return `data:${mimeType};base64,${logoBase64}`;
    } catch (error) {
        console.error('Error loading logo:', error);
        return '';
    }
}