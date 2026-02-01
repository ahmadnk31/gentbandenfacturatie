'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, Loader2, FileBarChart } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function ReportDialog() {
    const [open, setOpen] = useState(false);
    const [type, setType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
    const [date, setDate] = useState<Date>(new Date());
    const [isLoading, setIsLoading] = useState(false);

    const handleDownload = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/download-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, date }),
            });

            if (!response.ok) {
                throw new Error('Rapportage genereren mislukt');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Rapportage-${type}-${format(date, 'yyyy-MM-dd')}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();

            toast.success('Rapportage succesvol gedownload');
            setOpen(false);
        } catch (error) {
            console.error('Download report error:', error);
            toast.error('Kon rapportage niet downloaden');
        } finally {
            setIsLoading(false);
        }
    };

    const periodLabel =
        type === 'daily' ? 'Dag' :
            type === 'weekly' ? 'Week' : 'Maand';

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <FileBarChart className="h-4 w-4" />
                    Rapportage
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Download Rapportage</DialogTitle>
                    <DialogDescription>
                        Selecteer de periode waarvoor u een overzicht wilt downloaden.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Type Rapportage</Label>
                        <Select
                            value={type}
                            onValueChange={(v) => setType(v as typeof type)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="daily">Per Dag</SelectItem>
                                <SelectItem value="weekly">Per Week</SelectItem>
                                <SelectItem value="monthly">Per Maand</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label>Selecteer {periodLabel}</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? (
                                        type === 'monthly'
                                            ? format(date, 'MMMM yyyy', { locale: nl })
                                            : format(date, 'PPP', { locale: nl })
                                    ) : (
                                        <span>Kies een datum</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={(d) => d && setDate(d)}
                                    initialFocus
                                    locale={nl}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        onClick={handleDownload}
                        disabled={isLoading || !date}
                        className="w-full"
                    >
                        {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Download className="mr-2 h-4 w-4" />
                        )}
                        Download PDF
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
