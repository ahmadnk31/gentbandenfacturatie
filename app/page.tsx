import Link from 'next/link';
import { Plus, FileText, DollarSign, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/header';
import { getAllInvoices } from '@/lib/actions';
import { formatCurrency } from '@/lib/invoice-utils';
import { InvoiceList } from '@/components/invoice-list';

export default async function HomePage() {
  const invoices = await getAllInvoices();

  // Calculate stats
  const totalInvoices = invoices.length;
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);

  const recentInvoices = invoices.slice(0, 5);

  return (
    <div className="min-h-screen bg-background ">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Beheer facturen en betalingen
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/invoices/new">
              <Plus className="mr-2 h-5 w-5" />
              Nieuwe Factuur
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Totaal Facturen
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalInvoices}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Totale Omzet
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Status
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Alle betaald</div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Invoices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recente Facturen</CardTitle>
            <Button variant="ghost" asChild>
              <Link href="/invoices">Alle bekijken</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <InvoiceList invoices={recentInvoices} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
