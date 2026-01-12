import {
    Html,
    Head,
    Body,
    Container,
    Section,
    Text,
    Heading,
    Hr,
    Row,
    Column,
} from '@react-email/components';
import { InvoiceWithRelations } from '@/types/invoice';
import { shopConfig, invoiceConfig } from '@/lib/shop-config';

interface InvoiceEmailProps {
    invoice: InvoiceWithRelations;
}

export function InvoiceEmail({ invoice }: InvoiceEmailProps) {
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

    return (
        <Html>
            <Head />
            <Body style={main}>
                <Container style={container}>
                    {/* Header */}
                    <Section style={header}>
                        <Heading style={shopName}>{shopConfig.name}</Heading>
                        <Text style={shopDetails}>
                            {shopConfig.address}, {shopConfig.postalCode} {shopConfig.city}
                            <br />
                            {shopConfig.phone} | {shopConfig.email}
                            {shopConfig.taxId && (
                                <>
                                    <br />
                                    BTW-nr: {shopConfig.taxId}
                                </>
                            )}
                        </Text>
                    </Section>

                    <Hr style={divider} />

                    {/* Invoice Info */}
                    <Section>
                        <Heading style={invoiceTitle}>Factuur #{invoice.invoiceNumber}</Heading>
                        <Row>
                            <Column>
                                <Text style={label}>Factuurdatum</Text>
                                <Text style={value}>{formatDate(invoice.issuedAt)}</Text>
                            </Column>
                            <Column>
                                <Text style={label}>Status</Text>
                                <Text style={paidBadge}>BETAALD</Text>
                            </Column>
                        </Row>
                    </Section>

                    <Hr style={divider} />

                    {/* Customer Info */}
                    <Section>
                        <Text style={label}>Factuur aan</Text>
                        <Text style={value}>
                            <strong>{invoice.customer.name}</strong>
                            {invoice.customer.address && (
                                <>
                                    <br />
                                    {invoice.customer.address}
                                </>
                            )}
                            {invoice.customer.vatNumber && (
                                <>
                                    <br />
                                    BTW-nr: {invoice.customer.vatNumber}
                                </>
                            )}
                        </Text>
                    </Section>

                    <Hr style={divider} />

                    {/* Vehicle Info */}
                    {(invoice.licensePlate || invoice.vehicleModel || invoice.mileage) && (
                        <>
                            <Section>
                                <Text style={label}>Voertuig</Text>
                                <Row>
                                    {invoice.licensePlate && (
                                        <Column>
                                            <Text style={subLabel}>Kenteken</Text>
                                            <Text style={value}>{invoice.licensePlate}</Text>
                                        </Column>
                                    )}
                                    {invoice.vehicleModel && (
                                        <Column>
                                            <Text style={subLabel}>Merk & Model</Text>
                                            <Text style={value}>{invoice.vehicleModel}</Text>
                                        </Column>
                                    )}
                                    {invoice.mileage && (
                                        <Column>
                                            <Text style={subLabel}>Kilometerstand</Text>
                                            <Text style={value}>{invoice.mileage.toLocaleString()} km</Text>
                                        </Column>
                                    )}
                                </Row>
                            </Section>
                            <Hr style={divider} />
                        </>
                    )}

                    <Hr style={divider} />

                    {/* Items */}
                    <Section>
                        <Text style={label}>Factuurregels</Text>
                        {invoice.items.map((item) => (
                            <Row key={item.id} style={itemRow}>
                                <Column style={{ width: '50%' }}>
                                    <Text style={itemDescription}>{item.description}</Text>
                                </Column>
                                <Column style={{ width: '15%', textAlign: 'center' }}>
                                    <Text style={itemValue}>{item.quantity}x</Text>
                                </Column>
                                <Column style={{ width: '15%', textAlign: 'center' }}>
                                    <Text style={itemValue}>{item.vatRate}%</Text>
                                </Column>
                                <Column style={{ width: '20%', textAlign: 'right' }}>
                                    <Text style={itemValue}>{formatCurrency(item.total)}</Text>
                                </Column>
                            </Row>
                        ))}
                    </Section>

                    <Hr style={divider} />

                    {/* Totals */}
                    <Section style={totalsSection}>
                        <Row>
                            <Column style={{ width: '60%' }}></Column>
                            <Column style={{ width: '40%' }}>
                                <Row>
                                    <Column>
                                        <Text style={totalLabel}>Subtotaal</Text>
                                    </Column>
                                    <Column style={{ textAlign: 'right' }}>
                                        <Text style={totalValue}>{formatCurrency(invoice.subtotal)}</Text>
                                    </Column>
                                </Row>
                                <Row>
                                    <Column>
                                        <Text style={totalLabel}>BTW</Text>
                                    </Column>
                                    <Column style={{ textAlign: 'right' }}>
                                        <Text style={totalValue}>{formatCurrency(invoice.vatAmount)}</Text>
                                    </Column>
                                </Row>
                                <Hr style={divider} />
                                <Row>
                                    <Column>
                                        <Text style={grandTotalLabel}>Totaal</Text>
                                    </Column>
                                    <Column style={{ textAlign: 'right' }}>
                                        <Text style={grandTotalValue}>{formatCurrency(invoice.total)}</Text>
                                    </Column>
                                </Row>
                            </Column>
                        </Row>
                    </Section>

                    <Hr style={divider} />

                    {/* Footer */}
                    <Section style={footer}>
                        {shopConfig.bankAccount && (
                            <Text style={footerText}>Bank: {shopConfig.bankAccount}</Text>
                        )}
                        <Text style={thankYou}>Bedankt voor uw aankoop!</Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
}

// Styles
const main = {
    backgroundColor: '#f6f9fc',
    fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '40px',
    maxWidth: '600px',
    borderRadius: '8px',
};

const header = {
    textAlign: 'center' as const,
    marginBottom: '20px',
};

const shopName = {
    color: '#1a1a1a',
    fontSize: '24px',
    fontWeight: '700',
    margin: '0 0 10px',
};

const shopDetails = {
    color: '#666666',
    fontSize: '12px',
    lineHeight: '18px',
    margin: '0',
};

const divider = {
    borderColor: '#e6ebf1',
    margin: '20px 0',
};

const invoiceTitle = {
    color: '#1a1a1a',
    fontSize: '20px',
    fontWeight: '600',
    margin: '0 0 15px',
};

const label = {
    color: '#666666',
    fontSize: '12px',
    fontWeight: '500',
    textTransform: 'uppercase' as const,
    margin: '0 0 5px',
};

const subLabel = {
    color: '#666666',
    fontSize: '10px',
    fontWeight: '500',
    textTransform: 'uppercase' as const,
    margin: '0 0 2px',
};

const value = {
    color: '#1a1a1a',
    fontSize: '14px',
    margin: '0',
    lineHeight: '22px',
};

const paidBadge = {
    backgroundColor: '#dcfce7',
    color: '#166534',
    padding: '4px 12px',
    borderRadius: '9999px',
    fontSize: '12px',
    fontWeight: '600',
    display: 'inline-block',
};

const itemRow = {
    marginBottom: '10px',
};

const itemDescription = {
    color: '#1a1a1a',
    fontSize: '14px',
    margin: '0',
};

const itemValue = {
    color: '#666666',
    fontSize: '14px',
    margin: '0',
};

const totalsSection = {
    marginTop: '10px',
};

const totalLabel = {
    color: '#666666',
    fontSize: '14px',
    margin: '5px 0',
};

const totalValue = {
    color: '#1a1a1a',
    fontSize: '14px',
    margin: '5px 0',
};

const grandTotalLabel = {
    color: '#1a1a1a',
    fontSize: '16px',
    fontWeight: '600',
    margin: '10px 0',
};

const grandTotalValue = {
    color: '#1a1a1a',
    fontSize: '18px',
    fontWeight: '700',
    margin: '10px 0',
};

const footer = {
    textAlign: 'center' as const,
    marginTop: '20px',
};

const footerText = {
    color: '#666666',
    fontSize: '12px',
    margin: '5px 0',
};

const thankYou = {
    color: '#1a1a1a',
    fontSize: '14px',
    fontWeight: '600',
    marginTop: '20px',
};

export default InvoiceEmail;
