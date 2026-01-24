"use client"

import * as React from "react"
import { format } from "date-fns"
import { nl } from "date-fns/locale"
import { CalendarIcon, X } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangePickerProps {
    dateRange: DateRange | undefined
    onDateRangeChange: (range: DateRange | undefined) => void
    placeholder?: string
    className?: string
}

export function DateRangePicker({
    dateRange,
    onDateRangeChange,
    placeholder = "Selecteer datumbereik",
    className,
}: DateRangePickerProps) {
    const [open, setOpen] = React.useState(false)
    const [isMobile, setIsMobile] = React.useState(false)

    React.useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768)
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "w-full sm:w-[280px] justify-start text-left font-normal",
                        !dateRange && "text-muted-foreground",
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                    <span className="truncate">
                        {dateRange?.from ? (
                            dateRange.to ? (
                                <>
                                    {format(dateRange.from, "d MMM", { locale: nl })} -{" "}
                                    {format(dateRange.to, "d MMM yyyy", { locale: nl })}
                                </>
                            ) : (
                                format(dateRange.from, "d MMM yyyy", { locale: nl })
                            )
                        ) : (
                            placeholder
                        )}
                    </span>
                    {dateRange && (
                        <span
                            role="button"
                            tabIndex={0}
                            className="ml-auto h-5 w-5 rounded-sm opacity-50 hover:opacity-100 hover:bg-muted flex items-center justify-center shrink-0"
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                onDateRangeChange(undefined)
                                setOpen(false)
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    onDateRangeChange(undefined)
                                    setOpen(false)
                                }
                            }}
                        >
                            <X className="h-3 w-3" />
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-auto p-0"
                align={isMobile ? "center" : "start"}
                sideOffset={4}
            >
                <Calendar
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={onDateRangeChange}
                    numberOfMonths={isMobile ? 1 : 2}
                />
            </PopoverContent>
        </Popover>
    )
}

