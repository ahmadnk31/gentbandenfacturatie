'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { nl } from 'date-fns/locale';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

export function DateFilter() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const dateParam = searchParams.get('date');

    const date = dateParam ? new Date(dateParam) : undefined;

    const handleDateSelect = (newDate: Date | undefined) => {
        const params = new URLSearchParams(searchParams.toString());

        if (newDate) {
            params.set('date', format(newDate, 'yyyy-MM-dd'));
        } else {
            params.delete('date');
        }

        router.push(`?${params.toString()}`);
    };

    return (
        <div className="flex items-center gap-2">
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn(
                            "justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, 'd MMMM yyyy', { locale: nl }) : <span>Alle datums</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={handleDateSelect}
                        initialFocus
                        locale={nl}
                        disabled={(date) => date > new Date() || date < new Date('2000-01-01')}
                    />
                </PopoverContent>
            </Popover>
            {date && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDateSelect(undefined)}
                    aria-label="Filter wissen"
                >
                    <X className="h-4 w-4" />
                </Button>
            )}
        </div>
    );
}
