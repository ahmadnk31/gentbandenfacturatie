import * as React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/invoice-utils';

interface DailyRevenueCardProps {
    total: number;
    count: number;
    title: string;
}

export function DailyRevenueCard({ total, count, title }: DailyRevenueCardProps) {
    return (
        <Card className="border-blue-200 bg-blue-50/30 dark:bg-blue-900/10 transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    {title}
                </CardTitle>
                <CalendarIcon className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(total)}
                </div>
                <p className="text-xs text-muted-foreground">
                    {count} {count === 1 ? 'factuur' : 'facturen'}
                </p>
            </CardContent>
        </Card>
    );
}
