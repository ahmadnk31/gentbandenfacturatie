'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Send, Save, Loader2, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { CreateInvoiceInput, InvoiceItemInput } from '@/types/invoice';
import { invoiceConfig } from '@/lib/shop-config';
import {
    generateItemId,
    calculateItemTotal,
    formatCurrency,
    VAT_RATES,
} from '@/lib/invoice-utils';
import { createInvoice, updateInvoice, getCustomerByEmail, verifyVAT } from '@/lib/actions';
import { toast } from 'sonner';
import { InvoiceWithRelations } from '@/types/invoice';

const STORAGE_KEY = 'invoice-form-draft';

interface InvoiceFormProps {
    initialData?: InvoiceWithRelations;
}

export function InvoiceForm({ initialData }: InvoiceFormProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const isEdit = !!initialData;
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);

    // Customer state
    const [customerType, setCustomerType] = useState<'PRIVATE' | 'BUSINESS'>(initialData?.customer.type || 'PRIVATE');
    const [customerName, setCustomerName] = useState(initialData?.customer.name || '');
    const [customerEmail, setCustomerEmail] = useState(initialData?.customer.email || '');
    const [customerAddress, setCustomerAddress] = useState(initialData?.customer.address || '');
    const [customerVatNumber, setCustomerVatNumber] = useState(initialData?.customer.vatNumber || '');

    // Vehicle state
    const [licensePlate, setLicensePlate] = useState(initialData?.licensePlate || '');
    const [mileage, setMileage] = useState(initialData?.mileage ? String(initialData.mileage) : '');
    const [vehicleModel, setVehicleModel] = useState(initialData?.vehicleModel || '');

    // Payment state
    const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'PIN' | 'ONLINE'>(initialData?.paymentMethod || 'PIN');
    const [status, setStatus] = useState<'PAID' | 'UNPAID'>(initialData?.status || 'PAID');

    // Items state
    const [items, setItems] = useState<InvoiceItemInput[]>(
        initialData?.items.map(item => ({
            id: item.id,
            description: item.description,
            size: item.size || '',
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            vatRate: item.vatRate,
            total: item.total
        })) || [
            { id: generateItemId(), description: '', size: '', quantity: 1, unitPrice: '', vatRate: 21, total: 0 },
        ]
    );

    // Load from local storage
    useEffect(() => {
        if (isEdit) return; // Don't load draft when editing
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setCustomerType(parsed.customerType || 'PRIVATE');
                setCustomerName(parsed.customerName || '');
                setCustomerEmail(parsed.customerEmail || '');
                setCustomerAddress(parsed.customerAddress || '');
                setCustomerVatNumber(parsed.customerVatNumber || '');
                setLicensePlate(parsed.licensePlate || '');
                setMileage(parsed.mileage || '');
                setVehicleModel(parsed.vehicleModel || '');
                setPaymentMethod(parsed.paymentMethod || 'PIN');
                if (parsed.items && parsed.items.length > 0) {
                    setItems(parsed.items);
                }
            } catch (e) {
                console.error('Failed to load draft invoice', e);
            }
        }
    }, []);

    // Save to local storage
    useEffect(() => {
        if (isEdit) return; // Don't save draft when editing
        const draft = {
            customerType,
            customerName,
            customerEmail,
            customerAddress,
            customerVatNumber,
            licensePlate,
            mileage,
            vehicleModel,
            paymentMethod,
            status,
            items,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    }, [
        customerType,
        customerName,
        customerEmail,
        customerAddress,
        customerVatNumber,
        licensePlate,
        mileage,
        vehicleModel,
        paymentMethod,
        items,
    ]);

    // Calculations
    const subtotal = useMemo(
        () => items.reduce((sum, item) => sum + item.total, 0),
        [items]
    );

    const vatAmount = useMemo(
        () => items.reduce((sum, item) => sum + (item.total * item.vatRate) / 100, 0),
        [items]
    );

    const total = useMemo(() => subtotal + vatAmount, [subtotal, vatAmount]);

    const updateItem = (id: string, field: keyof InvoiceItemInput, value: string | number) => {
        setItems((prev) =>
            prev.map((item) => {
                if (item.id !== id) return item;
                const updated = { ...item, [field]: value };
                if (field === 'quantity' || field === 'unitPrice') {
                    // Recalculate total with new values
                    updated.total = calculateItemTotal(
                        field === 'quantity' ? value : item.quantity,
                        field === 'unitPrice' ? value : item.unitPrice
                    );
                }
                return updated;
            })
        );
    };

    const addItem = () => {
        setItems((prev) => [
            ...prev,
            { id: generateItemId(), description: '', size: '', quantity: 1, unitPrice: '', vatRate: 21, total: 0 },
        ]);
    };

    const removeItem = (id: string) => {
        if (items.length > 1) {
            setItems((prev) => prev.filter((item) => item.id !== id));
        }
    };

    const addTireTemplate = () => {
        setItems((prev) => [
            ...prev,
            {
                id: generateItemId(),
                description: '205/55 R16 91V Michelin Primacy 4',
                size: '205/55 R16',
                quantity: 2,
                unitPrice: 120,
                vatRate: 21,
                total: calculateItemTotal(2, 120)
            },
            {
                id: generateItemId(),
                description: 'Montage & Balanceren',
                quantity: 2,
                unitPrice: 15,
                vatRate: 21,
                total: calculateItemTotal(2, 15)
            },
            {
                id: generateItemId(),
                description: 'Verwijderingsbijdrage',
                quantity: 2,
                unitPrice: 2.50,
                vatRate: 21,
                total: calculateItemTotal(2, 2.50)
            }
        ]);
    };

    // Load from local storage... (existing code)

    // Debounced email lookup
    useEffect(() => {
        const lookupCustomer = async () => {
            if (!customerEmail || !customerEmail.includes('@') || customerEmail.length < 5) return;

            // Don't lookup if we just loaded from storage or if it's already the current customer
            // Need a way to debounce
            const timer = setTimeout(async () => {
                try {
                    // Start transition to avoid blocking UI
                    const customer = await getCustomerByEmail(customerEmail);

                    if (customer) {
                        toast.info('Klantgegevens gevonden en ingevuld');

                        // Only fill empty fields or overwrite if it looks like a new entry
                        setCustomerType(customer.type);
                        setCustomerName(customer.name);
                        if (customer.address) setCustomerAddress(customer.address);
                        if (customer.vatNumber) setCustomerVatNumber(customer.vatNumber);

                        // Fill vehicle info if available
                        if (customer.licensePlate) setLicensePlate(customer.licensePlate);
                        if (customer.mileage) setMileage(String(customer.mileage));
                        if (customer.vehicleModel) setVehicleModel(customer.vehicleModel);
                    }
                } catch (error) {
                    console.error('Error looking up customer:', error);
                }
            }, 800);

            return () => clearTimeout(timer);
        };

        lookupCustomer();
    }, [customerEmail]);

    const handleVerifyVAT = async () => {
        if (!customerVatNumber) {
            toast.error('Vul eerst een BTW-nummer in');
            return;
        }

        setIsVerifying(true);
        try {
            const result = await verifyVAT(customerVatNumber);
            if (result.valid) {
                toast.success('BTW-nummer is geldig');
                if (result.name) setCustomerName(result.name);
                if (result.address) setCustomerAddress(result.address.replace(/\n/g, ', '));
            } else {
                toast.error('Ongeldig BTW-nummer');
            }
        } catch (error: any) {
            toast.error(error.message || 'Fout bij verifiëren');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleSubmit = async (sendEmail: boolean) => {
        if (!customerName.trim()) {
            toast.error('Vul een klantnaam in');
            return;
        }

        if (items.every((item) => !item.description.trim())) {
            toast.error('Voeg minimaal één item toe');
            return;
        }

        setIsLoading(true);
        if (sendEmail) setIsSending(true);

        try {
            const input: CreateInvoiceInput = {
                customerType,
                customerName,
                customerEmail: customerEmail || undefined,
                customerAddress: customerAddress || undefined,
                customerVatNumber: customerType === 'BUSINESS' ? customerVatNumber : undefined,
                paymentMethod,
                status,
                items: items.filter((item) => item.description.trim() || (item.size && item.size.trim())),

                // Vehicle details
                licensePlate: licensePlate || undefined,
                mileage: mileage ? parseInt(mileage) : undefined,
                vehicleModel: vehicleModel || undefined,
            };

            let invoice;
            if (isEdit && initialData) {
                invoice = await updateInvoice(initialData.id, input);
            } else {
                invoice = await createInvoice(input);
            }

            if (sendEmail && customerEmail) {
                const response = await fetch('/api/send-invoice', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(invoice),
                });

                if (response.ok) {
                    toast.success(`Factuur succesvol opgeslagen en verzonden naar ${customerEmail}`);
                } else {
                    const result = await response.json();
                    toast.warning(`Factuur opgeslagen, maar kon niet worden verzonden. Fout: ${result.error}`);
                }
            } else {
                toast.success('Factuur succesvol opgeslagen (niet verzonden)');
            }

            // Invalidate invoices query to ensure list is refreshed
            queryClient.invalidateQueries({ queryKey: ['invoices'] });

            router.push(`/invoices/${invoice.id}`);

            // Clear draft on success
            if (!isEdit) {
                localStorage.removeItem(STORAGE_KEY);
            }
        } catch (error) {
            console.error('Error creating invoice:', error);
            toast.error('Er is een fout opgetreden bij het opslaan');
        } finally {
            setIsLoading(false);
            setIsSending(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Customer & Payment */}
            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Klantgegevens</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Type klant</Label>
                            <Select
                                value={customerType}
                                onValueChange={(v) => setCustomerType(v as 'PRIVATE' | 'BUSINESS')}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PRIVATE">Particulier</SelectItem>
                                    <SelectItem value="BUSINESS">Zakelijk</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="customerName">Naam *</Label>
                            <Input
                                id="customerName"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                placeholder={customerType === 'BUSINESS' ? 'Bedrijfsnaam' : 'Naam klant'}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="customerEmail">E-mail (Optioneel)</Label>
                            <Input
                                id="customerEmail"
                                type="email"
                                value={customerEmail}
                                onChange={(e) => setCustomerEmail(e.target.value)}
                                placeholder="klant@email.nl"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="customerAddress">Adres (Optioneel)</Label>
                            <Input
                                id="customerAddress"
                                value={customerAddress}
                                onChange={(e) => setCustomerAddress(e.target.value)}
                                placeholder="Straat, Postcode Plaats"
                            />
                        </div>

                        {customerType === 'BUSINESS' && (
                            <div className="space-y-2">
                                <Label htmlFor="vatNumber">BTW-nummer</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="vatNumber"
                                        value={customerVatNumber}
                                        onChange={(e) => setCustomerVatNumber(e.target.value.toUpperCase())}
                                        placeholder="NL123456789B01"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleVerifyVAT}
                                        disabled={isVerifying || !customerVatNumber}
                                    >
                                        {isVerifying ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            'Verifieer'
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Betaling</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Betaalmethode</Label>
                            <Select
                                value={paymentMethod}
                                onValueChange={(v) => setPaymentMethod(v as 'CASH' | 'PIN' | 'ONLINE')}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="CASH">Contant</SelectItem>
                                    <SelectItem value="PIN">PIN</SelectItem>
                                    <SelectItem value="ONLINE">Online</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select
                                value={status}
                                onValueChange={(v) => setStatus(v as 'PAID' | 'UNPAID')}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PAID">Betaald</SelectItem>
                                    <SelectItem value="UNPAID">Niet Betaald</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="mt-8 rounded-lg bg-muted/50 p-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Receipt className="h-4 w-4" />
                                <span>Factuur wordt automatisch aangemaakt na opslaan</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Vehicle Details */}
            <Card>
                <CardHeader>
                    <CardTitle>Voertuiggegevens</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-6 md:grid-cols-3">
                        <div className="space-y-2">
                            <Label htmlFor="licensePlate">Kenteken</Label>
                            <Input
                                id="licensePlate"
                                value={licensePlate}
                                onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                                placeholder="1-ABC-123"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="mileage">Kilometerstand</Label>
                            <Input
                                id="mileage"
                                type="number"
                                value={mileage}
                                onChange={(e) => setMileage(e.target.value)}
                                placeholder="150000"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="vehicleModel">Merk & Model</Label>
                            <Input
                                id="vehicleModel"
                                value={vehicleModel}
                                onChange={(e) => setVehicleModel(e.target.value)}
                                placeholder="Volkswagen Golf"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Invoice Items */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between overflow-x-auto">
                    <CardTitle>Factuurregels</CardTitle>
                    <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={addTireTemplate}>
                            <Plus className="mr-2 h-4 w-4" />
                            Banden Set
                        </Button>
                        <Button variant="outline" size="sm" onClick={addItem}>
                            <Plus className="mr-2 h-4 w-4" />
                            Regel toevoegen
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {items.map((item, index) => (
                        <div
                            key={item.id}
                            className="rounded-lg border bg-card p-4 space-y-4"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-muted-foreground">
                                    Regel {index + 1}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeItem(item.id)}
                                    disabled={items.length === 1}
                                >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>

                            <div className="grid grid-cols-12 gap-3">
                                <div className="col-span-12 md:col-span-3 space-y-2">
                                    <Label>Omschrijving</Label>
                                    <Input
                                        value={item.description}
                                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                        placeholder="Product of dienst"
                                    />
                                </div>
                                <div className="col-span-12 md:col-span-2 space-y-2">
                                    <Label>Maat</Label>
                                    <Input
                                        value={item.size}
                                        onChange={(e) => updateItem(item.id, 'size', e.target.value)}
                                        placeholder="bijv. 205/55 R16"
                                    />
                                </div>
                                <div className="col-span-4 md:col-span-1 space-y-2">
                                    <Label>Aantal</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        onChange={(e) =>
                                            updateItem(item.id, 'quantity', e.target.value)
                                        }
                                    />
                                </div>
                                <div className="col-span-8 md:col-span-2 space-y-2">
                                    <Label>Prijs</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={item.unitPrice}
                                        onChange={(e) =>
                                            updateItem(item.id, 'unitPrice', e.target.value)
                                        }
                                    />
                                </div>
                                <div className="col-span-6 md:col-span-2 space-y-2">
                                    <Label>BTW</Label>
                                    <Select
                                        value={String(item.vatRate)}
                                        onValueChange={(v) => updateItem(item.id, 'vatRate', parseFloat(v))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {VAT_RATES.map((rate) => (
                                                <SelectItem key={rate.value} value={String(rate.value)}>
                                                    {rate.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="col-span-6 md:col-span-2 space-y-2">
                                    <Label>Totaal</Label>
                                    <div className="flex h-9 items-center rounded-md border bg-muted/50 px-3 font-medium">
                                        {formatCurrency(item.total)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Summary */}
            <Card>
                <CardHeader>
                    <CardTitle>Overzicht</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="ml-auto max-w-xs space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Subtotaal</span>
                            <span>{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">BTW</span>
                            <span>{formatCurrency(vatAmount)}</span>
                        </div>
                        <div className="border-t pt-3">
                            <div className="flex justify-between text-xl font-bold">
                                <span>Totaal</span>
                                <span>{formatCurrency(total)}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleSubmit(false)}
                    disabled={isLoading || isSending}
                >
                    {isLoading && !isSending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="mr-2 h-4 w-4" />
                    )}
                    Opslaan
                </Button>
                <Button
                    type="button"
                    onClick={() => {
                        if (customerEmail) {
                            handleSubmit(true);
                        } else {
                            toast.error('Voeg eerst een e-mailadres toe');
                        }
                    }}
                    disabled={isLoading || isSending || !customerEmail}
                >
                    {isSending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Send className="mr-2 h-4 w-4" />
                    )}
                    {isEdit ? 'Update & Versturen' : 'Opslaan & Versturen'}
                </Button>
                {isEdit && (
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => router.push(`/invoices/${initialData.id}`)}
                    >
                        Annuleren
                    </Button>
                )}
            </div>
        </div>
    );
}
