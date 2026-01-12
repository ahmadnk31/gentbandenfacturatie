import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getInvoice } from '@/lib/actions';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/invoice-utils';
import { shopConfig } from '@/lib/shop-config';
import { InvoiceActions } from './invoice-actions';

interface InvoicePageProps {
    params: Promise<{ id: string }>;
}

export default async function InvoicePage({ params }: InvoicePageProps) {
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
                    <Button variant="ghost" asChild className="mb-4">
                        <Link href="/invoices">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Terug naar Facturen
                        </Link>
                    </Button>

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold tracking-tight">
                                    Factuur #{invoice.invoiceNumber}
                                </h1>
                                <Badge className={getStatusColor(invoice.status)} variant="secondary">
                                    Betaald
                                </Badge>
                            </div>
                            <p className="text-muted-foreground">
                                Aangemaakt op {formatDate(invoice.createdAt)}
                            </p>
                        </div>
                        <InvoiceActions invoice={invoice} />
                    </div>
                </div>

                {/* Invoice Preview */}
                <Card className="mx-auto max-w-3xl">
                    <CardContent className="p-8">
                        {/* Header */}
                        <div className="flex flex-col justify-between gap-6 sm:flex-row">
                            <div>
                                <h2 className="text-2xl font-bold">{shopConfig.name}</h2>
                                <p className="text-muted-foreground">
                                    {shopConfig.address}
                                    <br />
                                    {shopConfig.postalCode} {shopConfig.city}
                                    <br />
                                    {shopConfig.country}
                                </p>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    {shopConfig.phone}
                                    <br />
                                    {shopConfig.email}
                                </p>
                                {shopConfig.taxId && (
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        BTW-nr: {shopConfig.taxId}
                                    </p>
                                )}
                            </div>
                            <div className="text-right">
                                <h3 className="text-lg font-semibold">FACTUUR</h3>
                                <p className="text-2xl font-bold text-primary">#{invoice.invoiceNumber}</p>
                                <div className="mt-4 space-y-1 text-sm">
                                    <p>
                                        <span className="text-muted-foreground">Datum:</span>{' '}
                                        {formatDate(invoice.issuedAt)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Separator className="my-8" />

                        {/* Bill To */}
                        <div className="mb-8">
                            <h4 className="mb-2 text-sm font-medium text-muted-foreground uppercase">
                                Factuur aan
                            </h4>
                            <div>
                                <p className="font-semibold">{invoice.customer.name}</p>
                                {invoice.customer.address && <p>{invoice.customer.address}</p>}
                                {invoice.customer.email && (
                                    <p className="mt-2 text-sm">{invoice.customer.email}</p>
                                )}
                                {invoice.customer.vatNumber && (
                                    <p className="text-sm text-muted-foreground">
                                        BTW-nr: {invoice.customer.vatNumber}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Vehicle Details */}
                        {(invoice.licensePlate || invoice.vehicleModel || invoice.mileage) && (
                            <div className="mb-8">
                                <h4 className="mb-2 text-sm font-medium text-muted-foreground uppercase">
                                    Voertuig
                                </h4>
                                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                                    {invoice.licensePlate && (
                                        <div>
                                            <p className="text-xs text-muted-foreground">Kenteken</p>
                                            <p className="font-medium">{invoice.licensePlate}</p>
                                        </div>
                                    )}
                                    {invoice.vehicleModel && (
                                        <div>
                                            <p className="text-xs text-muted-foreground">Merk & Model</p>
                                            <p className="font-medium">{invoice.vehicleModel}</p>
                                        </div>
                                    )}
                                    {invoice.mileage && (
                                        <div>
                                            <p className="text-xs text-muted-foreground">Kilometerstand</p>
                                            <p className="font-medium">{invoice.mileage.toLocaleString()} km</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Items Table */}
                        <div className="mb-8 overflow-hidden rounded-lg border">
                            <table className="w-full">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-medium">
                                            Omschrijving
                                        </th>
                                        <th className="px-4 py-3 text-center text-sm font-medium">
                                            Aantal
                                        </th>
                                        <th className="px-4 py-3 text-center text-sm font-medium">
                                            BTW
                                        </th>
                                        <th className="px-4 py-3 text-right text-sm font-medium">
                                            Prijs
                                        </th>
                                        <th className="px-4 py-3 text-right text-sm font-medium">
                                            Totaal
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoice.items.map((item, index) => (
                                        <tr key={item.id} className={index % 2 === 1 ? 'bg-muted/20' : ''}>
                                            <td className="px-4 py-3 text-sm">{item.description}</td>
                                            <td className="px-4 py-3 text-center text-sm">{item.quantity}</td>
                                            <td className="px-4 py-3 text-center text-sm">{item.vatRate}%</td>
                                            <td className="px-4 py-3 text-right text-sm">
                                                {formatCurrency(item.unitPrice)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-sm font-medium">
                                                {formatCurrency(item.total)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Totals */}
                        <div className="flex justify-end">
                            <div className="w-64 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotaal</span>
                                    <span>{formatCurrency(invoice.subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">BTW</span>
                                    <span>{formatCurrency(invoice.vatAmount)}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between text-lg font-bold">
                                    <span>Totaal</span>
                                    <span>{formatCurrency(invoice.total)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Bank Details */}
                        {shopConfig.bankAccount && (
                            <>
                                <Separator className="my-8" />
                                <div className="text-center text-sm text-muted-foreground">
                                    <p>Bank: {shopConfig.bankAccount}</p>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
