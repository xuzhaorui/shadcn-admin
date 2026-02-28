'use client'

import * as React from 'react'
import {
    DndContext,
    type DragEndEvent,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    closestCenter,
    useSensor,
    useSensors,
} from '@dnd-kit/core'
import {
    SortableContext,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
    getCoreRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    getExpandedRowModel,
    flexRender,
    type ColumnDef,
    type ColumnFiltersState,
    type ExpandedState,
    type Row,
    type SortingState,
    type VisibilityState,
    type OnChangeFn,
    type Table as ReactTableInstance,
} from '@tanstack/react-table'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { DataTablePagination } from '../data-table/pagination'
import { DataTableToolbar } from '../data-table/toolbar'
import { TreeRow } from './tree-row'

interface TreeDataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    filterFields?: {
        label: string
        value: string
        options?: { label: string; value: string; icon?: React.ComponentType<{ className?: string }> }[]
    }[]
    gridTemplateColumns?: string
    getRowCanExpand?: (row: Row<TData>) => boolean
    getRowId?: (originalRow: TData, index: number, parent?: Row<TData>) => string
    onReorder?: (event: { activeId: string; overId: string }) => void
    expanded?: ExpandedState
    onExpandedChange?: OnChangeFn<ExpandedState>
    renderSelectionToolbar?: (context: {
        table: ReactTableInstance<TData>
        selectedCount: number
        clearSelection: () => void
    }) => React.ReactNode
}

export function TreeDataTable<TData, TValue>({
    columns,
    data,
    filterFields: _filterFields,
    getRowCanExpand,
    getRowId,
    onReorder,
    expanded: expandedProp,
    onExpandedChange: onExpandedChangeProp,
    renderSelectionToolbar,
}: TreeDataTableProps<TData, TValue>) {
    const [rowSelection, setRowSelection] = React.useState({})
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [internalExpanded, setInternalExpanded] = React.useState<ExpandedState>({})
    const expanded = expandedProp ?? internalExpanded
    const setExpanded = onExpandedChangeProp ?? setInternalExpanded

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            columnVisibility,
            rowSelection,
            columnFilters,
            expanded,
        },
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onExpandedChange: setExpanded,
        autoResetPageIndex: false,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        getExpandedRowModel: getExpandedRowModel(),
        getRowCanExpand: getRowCanExpand,
        getRowId,
        getSubRows: (row) => (row as { children?: TData[] }).children,
    })

    // DnD Sensors
    const sensors = useSensors(
        useSensor(MouseSensor, {}),
        useSensor(TouchSensor, {}),
        useSensor(KeyboardSensor, {})
    )

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        if (active.id !== over?.id) {
            onReorder?.({
                activeId: active.id as string,
                overId: over?.id as string
            })
        }
    }

    // Flattened rows for sortable context, considering expansion
    // NOTE: Drag and drop in a tree is complex. 
    // Simple reordering typically only works well within siblings or a flat list.
    // For this implementation, we simply allow dragging rows relative to visible rows.
    // Actual tree restructuring logic (reparenting) must be handled by the parent
    // via onReorder based on the IDs.
    const rows = table.getRowModel().rows
    const selectedCount = table.getFilteredSelectedRowModel().rows.length

    return (
        <div className='space-y-4'>
            <DataTableToolbar table={table} />
            <div className='rounded-md border'>
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id} colSpan={header.colSpan}>
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
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={rows.map(row => row.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {rows?.length ? (
                                    rows.map((row) => (
                                        <TreeRow key={row.id} row={row} />
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={columns.length}
                                            className='h-24 text-center'
                                        >
                                            No results.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </SortableContext>
                        </DndContext>
                    </TableBody>
                </Table>
            </div>
            <DataTablePagination table={table} />
            {renderSelectionToolbar?.({
                table,
                selectedCount,
                clearSelection: () => table.resetRowSelection(),
            })}
        </div>
    )
}
