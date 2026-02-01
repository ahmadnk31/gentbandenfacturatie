"use client"

import { useState, useMemo } from "react"
import {
    ColumnDef,
    ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    useReactTable,
    FilterFn,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
} from "@tanstack/react-table"
import { DateRange } from "react-day-picker"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { Search } from "lucide-react"

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    searchPlaceholder?: string
    dateKey?: string
    showDateFilter?: boolean
}

// Custom date range filter function
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dateRangeFilter = (row: any, columnId: string, filterValue: any) => {
    if (!filterValue) return true
    const { from, to } = filterValue as DateRange

    const cellValue = row.getValue(columnId)
    if (!cellValue) return true

    const rowDate = new Date(cellValue as string | Date)
    rowDate.setHours(0, 0, 0, 0)

    if (from) {
        const start = new Date(from)
        start.setHours(0, 0, 0, 0)
        if (rowDate < start) return false
    }

    if (to) {
        const end = new Date(to)
        end.setHours(23, 59, 59, 999)
        if (rowDate > end) return false
    }

    return true
}

export function DataTable<TData, TValue>({
    columns,
    data,
    searchPlaceholder = "Zoeken...",
    dateKey = "issuedAt",
    showDateFilter = true,
}: DataTableProps<TData, TValue>) {
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [globalFilter, setGlobalFilter] = useState('')
    const [sorting, setSorting] = useState<SortingState>([])
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)

    // Memoize columns with custom filter function for date column
    const columnsWithFilters = useMemo(() => {
        return columns.map((col) => {
            if ('accessorKey' in col && col.accessorKey === dateKey) {
                return {
                    ...col,
                    filterFn: dateRangeFilter as FilterFn<TData>,
                }
            }
            return col
        })
    }, [columns, dateKey])

    const table = useReactTable({
        data,
        columns: columnsWithFilters as ColumnDef<TData, TValue>[],
        getCoreRowModel: getCoreRowModel(),
        onColumnFiltersChange: setColumnFilters,
        onGlobalFilterChange: setGlobalFilter,
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onSortingChange: setSorting,
        state: {
            columnFilters,
            globalFilter,
            sorting,
        },
    })

    // Update date filter when date range changes
    const handleDateRangeChange = (range: DateRange | undefined) => {
        setDateRange(range)
        table.getColumn(dateKey)?.setFilterValue(range)
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
                {/* Search input */}
                <div className="relative w-full sm:flex-1 sm:min-w-[200px] sm:max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder={searchPlaceholder}
                        value={globalFilter ?? ""}
                        onChange={(event) =>
                            setGlobalFilter(event.target.value)
                        }
                        className="pl-9 w-full"
                    />
                </div>

                {/* Date range filter */}
                {showDateFilter && (
                    <DateRangePicker
                        dateRange={dateRange}
                        onDateRangeChange={handleDateRangeChange}
                        placeholder="Filter op datum..."
                    />
                )}
            </div>
            <div className="rounded-md border overflow-x-auto">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    Geen resultaten.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
