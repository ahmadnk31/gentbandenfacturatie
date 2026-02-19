import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getInvoice } from '@/lib/actions';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/invoice-utils';
import { shopConfig } from '@/lib/shop-config';
import { generateQRCode, generatePaymentString } from '@/lib/qr';
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
            <div className="print:hidden">
                <Header />
            </div>
            <main className="container mx-auto px-4 py-8 print:p-0 print:m-0 print:max-w-none">
                <div className="mb-8 print:hidden">
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
                                    {getStatusLabel(invoice.status)}
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
                <Card className="mx-auto max-w-3xl print:max-w-none print:shadow-none print:border-0" id="invoice-card">
                    <CardContent className="p-4 sm:p-8 print:p-0">
                        {/* Header */}
                        <div className="flex flex-col justify-between gap-6 sm:flex-row print:flex-row print:gap-8">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-bold print:text-lg">{shopConfig.name}</h2>
                                <p className="text-sm sm:text-base text-muted-foreground print:text-xs">
                                    {shopConfig.address}
                                    <br />
                                    {shopConfig.postalCode} {shopConfig.city}
                                    <br />
                                    {shopConfig.country}
                                </p>
                                <p className="mt-2 text-xs sm:text-sm text-muted-foreground print:text-xs">
                                    {shopConfig.phone}
                                    <br />
                                    {shopConfig.email}
                                </p>
                                {shopConfig.taxId && (
                                    <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
                                        BTW-nr: {shopConfig.taxId}
                                    </p>
                                )}
                            </div>
                            <div className="text-right">
                                <h4 className="mb-2 text-xs sm:text-sm font-medium text-muted-foreground uppercase print:text-xs">
                                    Factuur aan
                                </h4>
                                <div className="text-sm sm:text-base print:text-sm">
                                    <p className="font-semibold">{invoice.customer.name}</p>
                                    {invoice.customer.address && <p>{invoice.customer.address}</p>}
                                    {invoice.customer.email && (
                                        <p className="mt-1 text-xs sm:text-sm print:text-xs">{invoice.customer.email}</p>
                                    )}
                                    {invoice.customer.vatNumber && (
                                        <p className="text-xs sm:text-sm text-muted-foreground print:text-xs">
                                            BTW-nr: {invoice.customer.vatNumber}
                                        </p>
                                    )}
                                </div>
                                <div className="mt-4 sm:mt-6 text-xs sm:text-sm text-muted-foreground print:mt-4 print:text-xs">
                                    <p>
                                        Factuur #{invoice.invoiceNumber} • {formatDate(invoice.issuedAt)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Separator className="my-8" />



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
                        <div className="mb-8 overflow-x-auto rounded-lg border print:mb-4 print:border-gray-200">
                            <table className="w-full border-collapse">
                                <thead className="bg-secondary/50 print:bg-gray-100">
                                    <tr>
                                        <th className="border px-2 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium print:text-xs print:px-2 print:py-1">
                                            Omschrijving
                                        </th>
                                        <th className="border px-2 py-2 sm:px-4 sm:py-3 text-center text-xs sm:text-sm font-medium print:text-xs print:px-2 print:py-1">
                                            Maat
                                        </th>
                                        <th className="border px-2 py-2 sm:px-4 sm:py-3 text-center text-xs sm:text-sm font-medium print:text-xs print:px-2 print:py-1">
                                            Aantal
                                        </th>
                                        <th className="border px-2 py-2 sm:px-4 sm:py-3 text-center text-xs sm:text-sm font-medium print:text-xs print:px-2 print:py-1">
                                            BTW
                                        </th>
                                        <th className="border px-2 py-2 sm:px-4 sm:py-3 text-right text-xs sm:text-sm font-medium print:text-xs print:px-2 print:py-1">
                                            Prijs
                                        </th>
                                        <th className="border px-2 py-2 sm:px-4 sm:py-3 text-right text-xs sm:text-sm font-medium print:text-xs print:px-2 print:py-1">
                                            Totaal
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoice.items.map((item, index) => (
                                        <tr key={item.id} className={index % 2 === 1 ? 'bg-muted/20' : ''}>
                                            <td className="border px-2 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm print:text-xs print:px-2 print:py-1">{item.description}</td>
                                            <td className="border px-2 py-2 sm:px-4 sm:py-3 text-center text-xs sm:text-sm print:text-xs print:px-2 print:py-1">{item.size || '-'}</td>
                                            <td className="border px-2 py-2 sm:px-4 sm:py-3 text-center text-xs sm:text-sm print:text-xs print:px-2 print:py-1">{item.quantity}</td>
                                            <td className="border px-2 py-2 sm:px-4 sm:py-3 text-center text-xs sm:text-sm print:text-xs print:px-2 print:py-1">{item.vatRate}%</td>
                                            <td className="border px-2 py-2 sm:px-4 sm:py-3 text-right text-xs sm:text-sm print:text-xs print:px-2 print:py-1">
                                                {formatCurrency(item.unitPrice)}
                                            </td>
                                            <td className="border px-2 py-2 sm:px-4 sm:py-3 text-right text-xs sm:text-sm font-medium print:text-xs print:px-2 print:py-1">
                                                {formatCurrency(item.total)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Totals */}
                        <div className="flex justify-end">
                            <div className="w-full sm:w-64 space-y-2 print:w-48 print:space-y-1">
                                <div className="flex justify-between text-xs sm:text-sm print:text-xs">
                                    <span className="text-muted-foreground">Subtotaal</span>
                                    <span>{formatCurrency(invoice.subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-xs sm:text-sm print:text-xs">
                                    <span className="text-muted-foreground">BTW</span>
                                    <span>{formatCurrency(invoice.vatAmount)}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between text-base sm:text-lg font-bold print:text-sm">
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

                                    {/* QR Code */}
                                    <div className="mt-4 flex justify-center">
                                        <img
                                            src={await generateQRCode(generatePaymentString(invoice.total, invoice.invoiceNumber, shopConfig.bankAccount, shopConfig.owner))}
                                            alt="Payment QR Code"
                                            className="h-32 w-32"
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
