import {
    Document,
    Page,
    Text,
    View,
    Image,
    StyleSheet,
} from '@react-pdf/renderer';
import { InvoiceWithRelations } from '@/types/invoice';
import { shopConfig, invoiceConfig } from '@/lib/shop-config';

interface InvoicePDFProps {
    invoice: InvoiceWithRelations;
    qrCodeUrl?: string; // Optional QR code data URL
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
        style: 'currency',
        currency: invoiceConfig.currency,
    }).format(amount);
};

const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('nl-NL');
};

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontSize: 10,
        fontFamily: 'Helvetica',
        backgroundColor: '#ffffff',
    },
    header: {
        marginBottom: 30,
    },
    shopName: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    shopDetails: {
        fontSize: 9,
        color: '#666666',
        lineHeight: 1.5,
    },
    invoiceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    invoiceTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    invoiceNumber: {
        fontSize: 12,
        color: '#666666',
        marginTop: 5,
    },
    invoiceMeta: {
        textAlign: 'right',
    },
    paidBadge: {
        backgroundColor: '#dcfce7',
        color: '#166534',
        padding: '4 12',
        borderRadius: 4,
        fontSize: 10,
        fontWeight: 'bold',
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#666666',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    customerName: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 3,
    },
    customerDetails: {
        fontSize: 10,
        color: '#333333',
        lineHeight: 1.5,
    },
    table: {
        marginTop: 10,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f3f4f6',
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    tableRow: {
        flexDirection: 'row',
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    colDescription: {
        flex: 4,
    },
    colQty: {
        flex: 1,
        textAlign: 'center',
    },
    colVat: {
        flex: 1,
        textAlign: 'center',
    },
    colPrice: {
        flex: 1.5,
        textAlign: 'right',
    },
    colTotal: {
        flex: 1.5,
        textAlign: 'right',
    },
    headerText: {
        fontWeight: 'bold',
        fontSize: 9,
        color: '#374151',
    },
    cellText: {
        fontSize: 10,
        color: '#1f2937',
    },
    totalsSection: {
        marginTop: 20,
        alignItems: 'flex-end',
    },
    totalsBox: {
        width: 200,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    totalLabel: {
        fontSize: 10,
        color: '#666666',
    },
    totalValue: {
        fontSize: 10,
        color: '#1a1a1a',
    },
    grandTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        marginTop: 4,
    },
    grandTotalLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    grandTotalValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    footer: {
        position: 'absolute',
        bottom: 40,
        left: 40,
        right: 40,
        textAlign: 'center',
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    footerText: {
        fontSize: 9,
        color: '#666666',
        marginBottom: 3,
    },
    thankYou: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginTop: 10,
    },
});

export function InvoicePDF({ invoice, qrCodeUrl }: InvoicePDFProps) {
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header with Shop Info */}
                <View style={styles.header}>
                    <Text style={styles.shopName}>{shopConfig.name}</Text>
                    <Text style={styles.shopDetails}>
                        {shopConfig.address}, {shopConfig.postalCode} {shopConfig.city}
                    </Text>
                    <Text style={styles.shopDetails}>
                        {shopConfig.phone} | {shopConfig.email}
                    </Text>
                    {shopConfig.taxId && (
                        <Text style={styles.shopDetails}>BTW-nr: {shopConfig.taxId}</Text>
                    )}
                </View>

                {/* Invoice Header */}
                <View style={styles.invoiceHeader}>
                    <View>
                        <Text style={styles.invoiceTitle}>FACTUUR</Text>
                        <Text style={styles.invoiceNumber}>#{invoice.invoiceNumber}</Text>
                    </View>
                    <View style={styles.invoiceMeta}>
                        <Text style={styles.shopDetails}>Datum: {formatDate(invoice.issuedAt)}</Text>
                        <View style={{ marginTop: 8 }}>
                            <Text style={styles.paidBadge}>BETAALD</Text>
                        </View>
                    </View>
                </View>

                {/* Customer Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Factuur aan</Text>
                    <Text style={styles.customerName}>{invoice.customer.name}</Text>
                    {invoice.customer.address && (
                        <Text style={styles.customerDetails}>{invoice.customer.address}</Text>
                    )}
                    {invoice.customer.email && (
                        <Text style={styles.customerDetails}>{invoice.customer.email}</Text>
                    )}
                    {invoice.customer.vatNumber && (
                        <Text style={styles.customerDetails}>BTW-nr: {invoice.customer.vatNumber}</Text>
                    )}
                </View>

                {/* Vehicle Section */}
                {(invoice.licensePlate || invoice.vehicleModel || invoice.mileage) && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Voertuig</Text>
                        <View style={{ flexDirection: 'row', gap: 40 }}>
                            {invoice.licensePlate && (
                                <View>
                                    <Text style={styles.headerText}>Kenteken</Text>
                                    <Text style={styles.cellText}>{invoice.licensePlate}</Text>
                                </View>
                            )}
                            {invoice.vehicleModel && (
                                <View>
                                    <Text style={styles.headerText}>Merk & Model</Text>
                                    <Text style={styles.cellText}>{invoice.vehicleModel}</Text>
                                </View>
                            )}
                            {invoice.mileage && (
                                <View>
                                    <Text style={styles.headerText}>Kilometerstand</Text>
                                    <Text style={styles.cellText}>{invoice.mileage.toLocaleString()} km</Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* Items Table */}
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.colDescription, styles.headerText]}>Omschrijving</Text>
                        <Text style={[styles.colQty, styles.headerText]}>Aantal</Text>
                        <Text style={[styles.colVat, styles.headerText]}>BTW</Text>
                        <Text style={[styles.colPrice, styles.headerText]}>Prijs</Text>
                        <Text style={[styles.colTotal, styles.headerText]}>Totaal</Text>
                    </View>
                    {invoice.items.map((item) => (
                        <View key={item.id} style={styles.tableRow}>
                            <Text style={[styles.colDescription, styles.cellText]}>{item.description}</Text>
                            <Text style={[styles.colQty, styles.cellText]}>{item.quantity}</Text>
                            <Text style={[styles.colVat, styles.cellText]}>{item.vatRate}%</Text>
                            <Text style={[styles.colPrice, styles.cellText]}>{formatCurrency(item.unitPrice)}</Text>
                            <Text style={[styles.colTotal, styles.cellText]}>{formatCurrency(item.total)}</Text>
                        </View>
                    ))}
                </View>

                {/* Totals */}
                <View style={styles.totalsSection}>
                    <View style={styles.totalsBox}>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Subtotaal</Text>
                            <Text style={styles.totalValue}>{formatCurrency(invoice.subtotal)}</Text>
                        </View>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>BTW</Text>
                            <Text style={styles.totalValue}>{formatCurrency(invoice.vatAmount)}</Text>
                        </View>
                        <View style={styles.grandTotalRow}>
                            <Text style={styles.grandTotalLabel}>Totaal</Text>
                            <Text style={styles.grandTotalValue}>{formatCurrency(invoice.total)}</Text>
                        </View>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    {shopConfig.bankAccount && (
                        <Text style={styles.footerText}>Bank: {shopConfig.bankAccount}</Text>
                    )}
                    {/* QR Code */}
                    {/* QR Code */}
                    {qrCodeUrl && (
                        <View style={{ marginTop: 10, alignItems: 'center' }}>
                            <Image src={qrCodeUrl} style={{ width: 100, height: 100 }} />
                        </View>
                    )}
                    <Text style={styles.thankYou}>Bedankt voor uw aankoop!</Text>
                </View>
            </Page>
        </Document>
    );
}

export default InvoicePDF;
