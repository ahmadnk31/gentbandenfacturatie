import fs from 'fs';
import path from 'path';

export function getLogoDataUrl(): string {
    try {
        // Try common logo filenames (case-sensitive filesystems)
        const publicDir = path.join(process.cwd(), 'public');
        const candidates = ['logo.JPG', 'logo.jpg', 'logo.png', 'logo.jpeg'];
        let logoPath = '';
        let mimeType = 'image/jpeg';

        for (const name of candidates) {
            const candidate = path.join(publicDir, name);
            if (fs.existsSync(candidate)) {
                logoPath = candidate;
                mimeType = name.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
                break;
            }
        }

        if (!logoPath) {
            console.warn('Logo file not found in public/');
            return '';
        }

        const logoBuffer = fs.readFileSync(logoPath);
        const logoBase64 = logoBuffer.toString('base64');
        return `data:${mimeType};base64,${logoBase64}`;
    } catch (error) {
        console.error('Error loading logo:', error);
        return '';
    }
}