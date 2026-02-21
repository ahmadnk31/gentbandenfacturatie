import fs from 'fs';
import path from 'path';

export function getLogoDataUrl(): string {
    try {
        const logoPath = path.join(process.cwd(), 'public', 'logo.jpg');

        if (!fs.existsSync(logoPath)) {
            console.warn('Logo file not found at:', logoPath);
            return '';
        }

        const logoBuffer = fs.readFileSync(logoPath);
        const logoBase64 = logoBuffer.toString('base64');
        return `data:image/jpeg;base64,${logoBase64}`;
    } catch (error) {
        console.error('Error loading logo:', error);
        return '';
    }
}