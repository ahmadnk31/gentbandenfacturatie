'use client';

import Link from 'next/link';
import { formatCurrency, formatDate, getStatusColor, getPaymentMethodLabel, getStatusLabel } from '@/lib/invoice-utils';
import { InvoiceWithRelations } from '@/types/invoice';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Send, Trash2, MoreHorizontal, Download, Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllInvoices, deleteInvoice } from '@/lib/actions';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface InvoiceListProps {
    invoices: InvoiceWithRelations[];
}

export function InvoiceList({ invoices: initialInvoices }: InvoiceListProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [loading, setLoading] = useState<string | null>(null);

    const { data: invoices = initialInvoices, isLoading: isQueryLoading } = useQuery({
        queryKey: ['invoices'],
        queryFn: () => getAllInvoices(),
        initialData: initialInvoices,
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteInvoice(id),
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ['invoices'] });
            const previousInvoices = queryClient.getQueryData(['invoices']);
            queryClient.setQueryData(['invoices'], (old: any) =>
                old?.filter((invoice: any) => invoice.id !== id)
            );
            return { previousInvoices };
        },
        onError: (err, id, context) => {
            queryClient.setQueryData(['invoices'], context?.previousInvoices);
            alert('Kon factuur niet verwijderen');
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
        },
    });

    const optimisticInvoices = useMemo(() => invoices, [invoices]);

    const handleDelete = async (id: string) => {
        deleteMutation.mutate(id);
    };

    const handleDownload = async (invoice: InvoiceWithRelations) => {
        setLoading(invoice.id);
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
            setLoading(null);
        }
    };

    const handleSend = async (invoice: InvoiceWithRelations) => {
        if (!invoice.customer.email) {
            alert('Geen e-mailadres beschikbaar');
            return;
        }
        setLoading(invoice.id);
        try {
            const response = await fetch('/api/send-invoice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(invoice),
            });
            const result = await response.json();
            if (response.ok) {
                alert(`Factuur verzonden naar ${invoice.customer.email}`);
            } else {
                alert(`Fout: ${result.error}`);
            }
        } catch (error) {
            console.error('Error sending invoice:', error);
            alert('Kon factuur niet verzenden');
        } finally {
            setLoading(null);
        }
    };

    const columns: ColumnDef<InvoiceWithRelations>[] = useMemo(
        () => [
            {
                accessorKey: 'invoiceNumber',
                header: 'Factuur #',
                cell: ({ row }) => (
                    <div className="font-medium">{row.original.invoiceNumber}</div>
                ),
            },
            {
                accessorKey: 'customer.name',
                header: 'Klant',
                cell: ({ row }) => (
                    <div>
                        <div className="font-medium">{row.original.customer.name}</div>
                        {row.original.customer.email && (
                            <div className="text-sm text-muted-foreground">
                                {row.original.customer.email}
                            </div>
                        )}
                    </div>
                ),
            },
            {
                accessorKey: 'licensePlate',
                header: 'Kenteken',
                cell: ({ row }) => (
                    <div className="text-sm font-medium">{row.original.licensePlate || '-'}</div>
                ),
            },
            {
                accessorKey: 'issuedAt',
                header: 'Datum',
                cell: ({ row }) => formatDate(row.original.issuedAt),
            },
            {
                id: 'description',
                header: 'Omschrijving',
                accessorFn: (row: InvoiceWithRelations) => row.items.map((item) => item.description).join(', '),
                cell: ({ row }) => {
                    const descriptions = row.original.items.map((item) => item.description).join(', ');
                    return (
                        <div className="max-w-[300px] truncate text-sm text-muted-foreground" title={descriptions}>
                            {descriptions}
                        </div>
                    );
                },
            },
            {
                id: 'quantity',
                header: 'Aant.',
                accessorFn: (row: InvoiceWithRelations) => row.items.reduce((sum, item) => sum + item.quantity, 0),
                cell: ({ row }) => {
                    const totalQuantity = row.original.items.reduce((sum, item) => sum + item.quantity, 0);
                    return (
                        <div className="text-sm font-medium">
                            {totalQuantity}
                        </div>
                    );
                },
            },
            {
                id: 'maat',
                header: 'Maat',
                accessorFn: (row: InvoiceWithRelations) => row.items.map((item) => item.size).filter(Boolean).join(', '),
                cell: ({ row }) => {
                    const sizes = row.original.items.map((item) => item.size).filter(Boolean).join(', ');
                    return (
                        <div className="text-sm font-medium">
                            {sizes || '-'}
                        </div>
                    );
                },
            },
            {
                accessorKey: 'total',
                header: 'Bedrag',
                cell: ({ row }) => (
                    <div className="font-medium">{formatCurrency(row.original.total)}</div>
                ),
            },
            {
                accessorKey: 'paymentMethod',
                header: 'Betaalmethode',
                cell: ({ row }) => (
                    <div className="text-sm font-medium">
                        {getPaymentMethodLabel(row.original.paymentMethod)}
                    </div>
                ),
            },
            {
                accessorKey: 'status',
                header: 'Status',
                cell: ({ row }) => (
                    <Badge className={getStatusColor(row.original.status)} variant="secondary">
                        {getStatusLabel(row.original.status)}
                    </Badge>
                ),
            },
            {
                id: 'actions',
                header: () => <div className="text-right">Acties</div>,
                cell: ({ row }) => {
                    const invoice = row.original;
                    return (
                        <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" asChild>
                                <Link href={`/invoices/${invoice.id}`}>
                                    <Eye className="h-4 w-4" />
                                </Link>
                            </Button>
                            <Button variant="ghost" size="icon" asChild title="Bewerken">
                                <Link href={`/invoices/${invoice.id}/edit`}>
                                    <Pencil className="h-4 w-4" />
                                </Link>
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDownload(invoice)}
                                disabled={loading === invoice.id}
                                title="Download PDF"
                            >
                                <Download className="h-4 w-4" />
                            </Button>
                            {
                                invoice.customer.email && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleSend(invoice)}
                                        disabled={loading === invoice.id}
                                        title="Versturen via e-mail"
                                    >
                                        <Send className="h-4 w-4" />
                                    </Button>
                                )
                            }
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        disabled={loading === invoice.id}
                                        title="Verwijderen"
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Weet je het zeker?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Je staat op het punt factuur {invoice.invoiceNumber} te verwijderen.
                                            Dit kan niet ongedaan worden gemaakt.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Annuleren</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => handleDelete(invoice.id)}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                            Verwijderen
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    );
                },
            },
        ],
        [loading]
    );

    if (optimisticInvoices.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 rounded-full bg-muted p-4">
                    <MoreHorizontal className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">Nog geen facturen</h3>
                <p className="mt-2 text-muted-foreground">
                    Maak je eerste factuur aan om te beginnen.
                </p>
                <Button asChild className="mt-4">
                    <Link href="/invoices/new">Nieuwe Factuur</Link>
                </Button>
            </div>
        );
    }

    return (
        <DataTable
            columns={columns}
            data={optimisticInvoices}
            searchPlaceholder="Zoeken op nummer, klant, maat..."
        />
    );
}
