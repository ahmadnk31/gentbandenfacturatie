import { notFound } from 'next/navigation';
import { getInvoice } from '@/lib/actions';
import { Header } from '@/components/header';
import { InvoiceForm } from '@/components/invoice-form';

interface EditInvoicePageProps {
    params: Promise<{ id: string }>;
}

export default async function EditInvoicePage({ params }: EditInvoicePageProps) {
    const { id } = await params;
    const invoice = await getInvoice(id);

    if (!invoice) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Factuur Bewerken</h1>
                    <p className="text-muted-foreground">
                        Pas de gegevens van factuur #{invoice.invoiceNumber} aan
                    </p>
                </div>

                <InvoiceForm initialData={invoice} />
            </main>
        </div>
    );
}
