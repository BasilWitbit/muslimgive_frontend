"use client"

import React from "react"
import {
    ColumnDef,
    Row,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    useReactTable,
} from "@tanstack/react-table"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export type ColDef<TData, TValue = unknown> = ColumnDef<TData, TValue>

interface TableComponentProps<TData, TValue> {
    cols: ColDef<TData, TValue>[]
    data: TData[]
    enabledPagination?: boolean
    initialPageSize?: number
    pageSizeOptions?: number[]
    onRowClick?: (row: Row<TData>) => void
}

export function TableComponent<TData, TValue = unknown>({
    cols,
    data,
    enabledPagination = false,
    initialPageSize = 10,
    pageSizeOptions = [5, 10, 20, 50, 100],
    onRowClick,
}: TableComponentProps<TData, TValue>) {
    const table = useReactTable({
        data,
        columns: cols,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: {
            pagination: {
                pageIndex: 0,
                pageSize: initialPageSize,
            },
        },
    })

    const rows = enabledPagination
        ? table.getPaginationRowModel().rows
        : table.getRowModel().rows

    return (
        <div className="overflow-hidden rounded-md border">
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <TableHead key={header.id} className="text-sm text-muted-foreground bg-white/0 px-4 py-3">
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(
                                            header.column.columnDef.header,
                                            header.getContext()
                                        )}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {rows?.length ? (
                        rows.map((row) => (
                            <TableRow
                                key={row.id}
                                data-state={row.getIsSelected() && "selected"}
                                onClick={(e) => {
                                    if (!onRowClick) return
                                    const target = e.target as HTMLElement | null
                                    if (target && target.closest("button,input,textarea,select,a")) return
                                    onRowClick(row)
                                }}
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
                            <TableCell colSpan={cols.length} className="h-24 text-center">
                                No results.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            {enabledPagination && pageSizeOptions.length > 1 && (
                <div className="flex w-full items-center justify-between gap-2 p-3">
                    <div className="flex items-center gap-2">
                        <span className="text-sm">Rows per page</span>
                        <Select
                            value={String(table.getState().pagination.pageSize)}
                            onValueChange={(value) => table.setPageSize(Number(value))}
                        >
                            <SelectTrigger className="h-8 w-[100px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {pageSizeOptions.map((size) => (
                                    <SelectItem key={size} value={String(size)}>
                                        {size}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="text-sm">
                        Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()} , total {table.getPrePaginationRowModel().rows.length}
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            onClick={() => table.setPageIndex(0)}
                            disabled={!table.getCanPreviousPage()}
                        >
                            « First
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            ‹ Prev
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            Next ›
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                            disabled={!table.getCanNextPage()}
                        >
                            Last »
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
