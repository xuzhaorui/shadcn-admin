'use client'

import { CSS } from '@dnd-kit/utilities'
import { useSortable } from '@dnd-kit/sortable'
import { flexRender, type Row } from '@tanstack/react-table'
import { GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TableCell, TableRow } from '@/components/ui/table'

interface TreeRowProps<T> {
    row: Row<T>
}

export function TreeRow<T>({ row }: TreeRowProps<T>) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: row.id,
    })

    // Apply transform for drag and drop visual feedback
    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1 : 0,
        position: isDragging ? 'relative' : undefined,
    } as React.CSSProperties

    return (
        <TableRow
            ref={setNodeRef}
            style={style}
            data-state={row.getIsSelected() && 'selected'}
        >
            {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                    {cell.column.id === 'select' ? (
                        // Render selection checkbox or similar if applicable
                        flexRender(cell.column.columnDef.cell, cell.getContext())
                    ) : cell.column.id === 'drag-handle' ? (
                        <Button
                            variant='ghost'
                            size='icon'
                            className='h-8 w-8 cursor-grab ring-offset-background active:cursor-grabbing'
                            {...attributes}
                            {...listeners}
                        >
                            <GripVertical className='h-4 w-4' />
                            <span className='sr-only'>Move</span>
                        </Button>
                    ) : (
                        flexRender(cell.column.columnDef.cell, cell.getContext())
                    )}
                </TableCell>
            ))}
        </TableRow>
    )
}
