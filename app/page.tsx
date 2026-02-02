import Link from 'next/link';
import { Plus, FileText, DollarSign, CheckCircle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/header';
import { getAllInvoices } from '@/lib/actions';
import { formatCurrency } from '@/lib/invoice-utils';
import { InvoiceList } from '@/components/invoice-list';
import { ReportDialog } from '@/components/report-dialog';
import { TireRecommendations } from '@/components/tire-recommendations';
import { getTopTireSizes } from '@/lib/report-actions';
import { DailyRevenueCard } from '@/components/daily-revenue-card';
import { DateFilter } from '@/components/date-filter';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

export const dynamic = 'force-dynamic';

interface HomePageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedParams = await searchParams;
  const dateParam = resolvedParams?.date;

  // Determine date filter
  const filteredDate = dateParam ? new Date(dateParam) : undefined;

  let startOfDay: Date | undefined;
  let endOfDay: Date | undefined;

  if (filteredDate) {
    startOfDay = new Date(filteredDate);
    startOfDay.setHours(0, 0, 0, 0);

    endOfDay = new Date(filteredDate);
    endOfDay.setHours(23, 59, 59, 999);
  }

  const [invoices, tireRecommendations] = await Promise.all([
    getAllInvoices(),
    getTopTireSizes(5, startOfDay, endOfDay)
  ]);

  // Filter invoices for stats (Global Filter)
  let filteredInvoices = invoices;
  if (startOfDay && endOfDay) {
    filteredInvoices = invoices.filter(inv => {
      const invDate = new Date(inv.issuedAt);
      return invDate >= startOfDay! && invDate <= endOfDay!;
    });
  }

  // Calculate stats based on filtered list
  const totalInvoices = filteredInvoices.length;
  const paidInvoices = filteredInvoices.filter(inv => inv.status === 'PAID');
  const unpaidInvoices = filteredInvoices.filter(inv => inv.status === 'UNPAID');

  const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const outstandingAmount = unpaidInvoices.reduce((sum, inv) => sum + inv.total, 0);

  // Daily Card Logic
  // If filtered, show stats for that day (Issued Total).
  // If NOT filtered, show "Today's" stats.
  let dailyTotal = 0;
  let dailyCount = 0;
  let dailyTitle = "Omzet Vandaag";

  if (filteredDate) {
    dailyTotal = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
    dailyCount = filteredInvoices.length;
    dailyTitle = `Omzet ${format(filteredDate, 'd MMM', { locale: nl })}`;
  } else {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaysInvoices = invoices.filter(inv => {
      const invDate = new Date(inv.issuedAt);
      return invDate >= today;
    });

    dailyTotal = todaysInvoices.reduce((sum, inv) => sum + inv.total, 0);
    dailyCount = todaysInvoices.length;
  }

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
          <div className="flex gap-2">
            <DateFilter />
            <ReportDialog />
            <Button asChild size="lg">
              <Link href="/invoices/new">
                <Plus className="mr-2 h-5 w-5" />
                Nieuwe Factuur
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <DailyRevenueCard
            total={dailyTotal}
            count={dailyCount}
            title={dailyTitle}
          />
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
              <p className="text-xs text-muted-foreground">
                Van {paidInvoices.length} facturen
              </p>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50/30 dark:bg-orange-900/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-orange-600 dark:text-orange-400">
                Openstaand
              </CardTitle>
              <DollarSign className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {formatCurrency(outstandingAmount)}
              </div>
              <p className="text-xs text-muted-foreground">
                {unpaidInvoices.length} facturen
              </p>
            </CardContent>
          </Card>

          <TireRecommendations recommendations={tireRecommendations} />
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
