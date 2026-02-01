import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import { getAllInvoices } from '@/lib/actions';
import { InvoiceList } from '@/components/invoice-list';

export const dynamic = 'force-dynamic';

export default async function InvoicesPage() {
    const invoices = await getAllInvoices();

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container mx-auto px-4 py-8">
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Facturen</h1>
                        <p className="text-muted-foreground">
                            Bekijk en beheer al je facturen
                        </p>
                    </div>
                    <Button asChild>
                        <Link href="/invoices/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Nieuwe Factuur
                        </Link>
                    </Button>
                </div>

                <InvoiceList invoices={invoices} />
            </main>
        </div>
    );
}
