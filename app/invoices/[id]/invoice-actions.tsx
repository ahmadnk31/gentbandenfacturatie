'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Download, Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InvoiceWithRelations } from '@/types/invoice';

interface InvoiceActionsProps {
    invoice: InvoiceWithRelations;
}

export function InvoiceActions({ invoice }: InvoiceActionsProps) {
    const router = useRouter();
    const [sending, setSending] = useState(false);
    const [downloading, setDownloading] = useState(false);

    const handleSend = async () => {
        if (!invoice.customer.email) {
            alert('Geen e-mailadres beschikbaar');
            return;
        }
        setSending(true);
        try {
            const response = await fetch('/api/send-invoice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(invoice),
            });
            const result = await response.json();
            if (response.ok) {
                alert(`Factuur met PDF verzonden naar ${invoice.customer.email}`);
                router.refresh();
            } else {
                alert(`Fout: ${result.error}`);
            }
        } catch (error) {
            console.error('Error sending invoice:', error);
            alert('Kon factuur niet verzenden');
        } finally {
            setSending(false);
        }
    };

    const handleDownload = async () => {
        setDownloading(true);
        try {
            const response = await fetch('/api/download-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(invoice),
            });

            if (!response.ok) {
                throw new Error('Download failed');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Factuur-${invoice.invoiceNumber}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (error) {
            console.error('Error downloading PDF:', error);
            alert('Kon PDF niet downloaden');
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" />
                Afdrukken
            </Button>
            <Button variant="outline" onClick={handleDownload} disabled={downloading}>
                {downloading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Download className="mr-2 h-4 w-4" />
                )}
                Download PDF
            </Button>
            {invoice.customer.email && (
                <Button onClick={handleSend} disabled={sending}>
                    {sending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Send className="mr-2 h-4 w-4" />
                    )}
                    Versturen via e-mail
                </Button>
            )}
        </div>
    );
}
