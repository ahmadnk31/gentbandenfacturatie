'use server';

import prisma from './prisma';
import { InvoiceWithRelations } from '@/types/invoice';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { transformInvoice } from './invoice-utils';

export interface ReportData {
    period: {
        type: 'daily' | 'weekly' | 'monthly';
        start: Date;
        end: Date;
    };
    stats: {
        totalRevenue: number;
        outstandingAmount: number;
        vatAmount: number;
        count: number;
        paidCount: number;
        unpaidCount: number;
    };
    invoices: InvoiceWithRelations[];
}

export async function getReportData(
    type: 'daily' | 'weekly' | 'monthly',
    date: Date
): Promise<ReportData> {
    let start: Date;
    let end: Date;

    if (type === 'daily') {
        start = startOfDay(date);
        end = endOfDay(date);
    } else if (type === 'weekly') {
        start = startOfWeek(date, { weekStartsOn: 1 });
        end = endOfWeek(date, { weekStartsOn: 1 });
    } else {
        start = startOfMonth(date);
        end = endOfMonth(date);
    }

    const prismaInvoices = await prisma.invoice.findMany({
        where: {
            issuedAt: {
                gte: start,
                lte: end,
            },
        },
        include: {
            customer: true,
            payment: true,
            items: true,
        },
        orderBy: {
            issuedAt: 'asc',
        },
    });

    const invoices = prismaInvoices.map(transformInvoice);

    const stats = invoices.reduce(
        (acc, inv) => {
            acc.count++;
            if (inv.status === 'PAID') {
                acc.totalRevenue += inv.total;
                acc.paidCount++;
            } else {
                acc.outstandingAmount += inv.total;
                acc.unpaidCount++;
            }
            acc.vatAmount += inv.vatAmount;
            return acc;
        },
        {
            totalRevenue: 0,
            outstandingAmount: 0,
            vatAmount: 0,
            count: 0,
            paidCount: 0,
            unpaidCount: 0,
        }
    );

    return {
        period: { type, start, end },
        stats,
        invoices,
    };
}

export async function getTopTireSizes(limit: number = 5) {
    const result = await prisma.invoiceItem.groupBy({
        by: ['size'],
        where: {
            AND: [
                { size: { not: null } },
                { size: { not: '' } }
            ]
        },
        _count: {
            size: true,
        },
        orderBy: {
            _count: {
                size: 'desc',
            },
        },
        take: limit,
    });

    return result.map((item) => ({
        size: item.size as string,
        count: item._count.size,
    }));
}

