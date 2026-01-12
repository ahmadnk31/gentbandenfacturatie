import { Header } from '@/components/header';
import { InvoiceForm } from '@/components/invoice-form';

export default function NewInvoicePage() {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Nieuwe Factuur</h1>
                    <p className="text-muted-foreground">
                        Vul de gegevens in om een factuur aan te maken
                    </p>
                </div>

                <InvoiceForm />
            </main>
        </div>
    );
}
