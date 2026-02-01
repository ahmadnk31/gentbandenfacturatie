import React from 'react';
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Font,
} from '@react-pdf/renderer';
import { ReportData } from '@/lib/report-actions';
import { formatCurrency, formatDate } from '@/lib/invoice-utils';
import { shopConfig } from '@/lib/shop-config';

// Register fonts if needed
// Font.register({ family: 'Helvetica', src: ... });

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontSize: 10,
        fontFamily: 'Helvetica',
        color: '#333',
    },
    header: {
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
        paddingBottom: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 12,
        color: '#666',
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 10,
        backgroundColor: '#F9F9F9',
        padding: 5,
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 20,
        marginBottom: 20,
    },
    statBox: {
        flex: 1,
        padding: 10,
        borderWidth: 1,
        borderColor: '#EEE',
        borderRadius: 4,
    },
    statLabel: {
        fontSize: 8,
        color: '#666',
        marginBottom: 5,
    },
    statValue: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    table: {
        width: 'auto',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
        minHeight: 25,
        alignItems: 'center',
    },
    tableHeader: {
        backgroundColor: '#F5F5F5',
        fontWeight: 'bold',
    },
    col1: { width: '12%' },
    col2: { width: '25%' },
    colMaat: { width: '20%' },
    col3: { width: '13%' },
    col4: { width: '15%' },
    col5: { width: '15%' },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        fontSize: 8,
        color: '#999',
        textAlign: 'center',
        borderTopWidth: 1,
        borderTopColor: '#EEE',
        paddingTop: 10,
    },
});

interface ReportPDFProps {
    data: ReportData;
}

export const ReportPDF = ({ data }: ReportPDFProps) => {
    const periodLabel =
        data.period.type === 'daily' ? 'Dag' :
            data.period.type === 'weekly' ? 'Week' : 'Maand';

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>{shopConfig.name} - Rapportage</Text>
                    <Text style={styles.subtitle}>
                        {periodLabel} overzicht: {formatDate(data.period.start)} t/m {formatDate(data.period.end)}
                    </Text>
                </View>

                {/* Stats */}
                <View style={styles.statsContainer}>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>OMZET (BETAALD)</Text>
                        <Text style={styles.statValue}>{formatCurrency(data.stats.totalRevenue)}</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>OPENSTAAND</Text>
                        <Text style={[styles.statValue, { color: '#EA580C' }]}>{formatCurrency(data.stats.outstandingAmount)}</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>BTW TOTAAL</Text>
                        <Text style={styles.statValue}>{formatCurrency(data.stats.vatAmount)}</Text>
                    </View>
                </View>

                {/* Detailed Table */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Overzicht Facturen ({data.stats.count})</Text>
                    <View style={styles.table}>
                        {/* Table Header */}
                        <View style={[styles.tableRow, styles.tableHeader]}>
                            <Text style={styles.col1}>Nummer</Text>
                            <Text style={styles.col2}>Klant</Text>
                            <Text style={styles.colMaat}>Maat</Text>
                            <Text style={styles.col3}>Datum</Text>
                            <Text style={styles.col4}>Bedrag</Text>
                            <Text style={styles.col5}>Status</Text>
                        </View>

                        {/* Table Rows */}
                        {data.invoices.map((inv) => (
                            <View key={inv.id} style={styles.tableRow}>
                                <Text style={styles.col1}>{inv.invoiceNumber}</Text>
                                <Text style={styles.col2}>{inv.customer.name}</Text>
                                <Text style={styles.colMaat}>
                                    {inv.items.map(i => i.size).filter(Boolean).join(', ')}
                                </Text>
                                <Text style={styles.col3}>{formatDate(inv.issuedAt)}</Text>
                                <Text style={styles.col4}>{formatCurrency(inv.total)}</Text>
                                <Text style={[styles.col5, inv.status === 'UNPAID' ? { color: '#EA580C' } : {}]}>
                                    {inv.status === 'PAID' ? 'Betaald' : 'Niet Betaald'}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Footer */}
                <Text style={styles.footer}>
                    Gegenereerd op {new Date().toLocaleString('nl-NL')} • {shopConfig.name}
                </Text>
            </Page>
        </Document>
    );
};
