import { useEffect, useState } from 'react'
import {
    type SortingState,
    type VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table'
import { type NavigateFn, useTableUrlState } from '@/hooks/use-table-url-state'
import { cn } from '@/lib/utils'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { DataTablePagination, DataTableToolbar } from '@/components/data-table'
import { roleStatuses } from '../data/data'
import { type Role } from '../data/schema'
import { rolesColumns as columns } from './roles-columns'
import { SelectionToolbar } from './SelectionToolbar'

interface RolesTableProps {
    data: Role[]
    total: number
    loading?: boolean
    search: Record<string, unknown>
    navigate: NavigateFn
    onBatchEnable?: (selectedIds: string[]) => Promise<void> | void
    onBatchDisable?: (selectedIds: string[]) => Promise<void> | void
    onBatchDelete?: (selectedIds: string[]) => Promise<void> | void
}

export function RolesTable({
    data,
    total,
    loading = false,
    search,
    navigate,
    onBatchEnable,
    onBatchDisable,
    onBatchDelete,
}: RolesTableProps) {
    const [rowSelection, setRowSelection] = useState({})
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const [sorting, setSorting] = useState<SortingState>([])
    const {
        columnFilters,
        onColumnFiltersChange,
        pagination,
        onPaginationChange,
        ensurePageInRange,
    } = useTableUrlState({
        search,
        navigate,
        pagination: { defaultPage: 1, defaultPageSize: 10 },
        globalFilter: { enabled: false },
        columnFilters: [
            { columnId: 'name', searchKey: 'keyword', type: 'string' },
            { columnId: 'status', searchKey: 'status', type: 'array' },
        ],
    })
    const pageCount = Math.max(1, Math.ceil(total / Math.max(1, pagination.pageSize)))

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            pagination,
            rowSelection,
            columnFilters,
            columnVisibility,
        },
        manualPagination: true,
        pageCount,
        enableRowSelection: (row) => row.original.code !== 'admin',
        onPaginationChange,
        onColumnFiltersChange,
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting,
        onColumnVisibilityChange: setColumnVisibility,
        autoResetPageIndex: false,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
    })

    useEffect(() => {
        if (loading) return
        ensurePageInRange(pageCount)
    }, [loading, ensurePageInRange, pageCount])

    const selectedRows = table.getFilteredSelectedRowModel().rows
    const selectedCount = selectedRows.length

    const getSelectedIds = () => selectedRows.map((row) => row.original.id)

    const handleBatchEnable = async () => {
        if (!onBatchEnable) return
        await onBatchEnable(getSelectedIds())
        table.resetRowSelection()
    }

    const handleBatchDisable = async () => {
        if (!onBatchDisable) return
        await onBatchDisable(getSelectedIds())
        table.resetRowSelection()
    }

    const handleBatchDelete = async () => {
        if (!onBatchDelete) return
        await onBatchDelete(getSelectedIds())
        table.resetRowSelection()
    }

    const handleClearSelection = () => {
        table.resetRowSelection()
    }

    return (
        <div className={cn('flex flex-1 flex-col gap-4')}>
            <DataTableToolbar
                table={table}
                searchPlaceholder="搜索角色..."
                searchKey="name"
                filters={[
                    {
                        columnId: 'status',
                        title: '状态',
                        options: roleStatuses.map((s) => ({ ...s })),
                    },
                ]}
            />
            <div className="overflow-hidden rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="group/row">
                                {headerGroup.headers.map((header) => (
                                    <TableHead
                                        key={header.id}
                                        colSpan={header.colSpan}
                                        className={cn(
                                            'bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted'
                                        )}
                                    >
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
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && 'selected'}
                                    className="group/row"
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell
                                            key={cell.id}
                                            className={cn(
                                                'bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted'
                                            )}
                                        >
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
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
                                    暂无数据
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <DataTablePagination table={table} className="mt-auto" />

            <SelectionToolbar
                selectedCount={selectedCount}
                onClearSelection={handleClearSelection}
                onBatchEnable={onBatchEnable ? handleBatchEnable : undefined}
                onBatchDisable={onBatchDisable ? handleBatchDisable : undefined}
                onBatchDelete={onBatchDelete ? handleBatchDelete : undefined}
            />
        </div>
    )
}
