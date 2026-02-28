'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'

export interface TreeSelectProps<T> {
    data: T[]
    value?: string | string[]
    onChange?: (value: string | string[]) => void
    multiple?: boolean
    getChildren?: (item: T) => T[] | undefined
    getId?: (item: T) => string
    getLabel?: (item: T) => string
    onLoadChildren?: (item: T) => Promise<T[]>
    placeholder?: string
    searchPlaceholder?: string
    emptyText?: string
    disabled?: boolean
    className?: string
}

interface TreeItemProps<T> {
    item: T
    level: number
    selectedValues: Set<string>
    onSelect: (value: string) => void
    getChildren: (item: T) => T[] | undefined
    getId: (item: T) => string
    getLabel: (item: T) => string
    onLoadChildren?: (item: T) => Promise<T[]>
    loadingIds: Set<string>
    setLoadingIds: React.Dispatch<React.SetStateAction<Set<string>>>
}

const defaultGetChildren = <T,>(item: T): T[] | undefined => {
    return (item as { children?: T[] }).children
}

const defaultGetId = <T,>(item: T): string => {
    return String((item as { id?: unknown }).id ?? '')
}

const defaultGetLabel = <T,>(item: T): string => {
    const target = item as { name?: unknown; label?: unknown }
    const label = target.name ?? target.label
    return typeof label === 'string' ? label : ''
}

function TreeItem<T>({
    item,
    level,
    selectedValues,
    onSelect,
    getChildren,
    getId,
    getLabel,
    onLoadChildren,
    loadingIds,
    setLoadingIds,
}: TreeItemProps<T>) {
    const id = getId(item)
    const label = getLabel(item)
    const children = getChildren(item)
    const isLoading = loadingIds.has(id)
    const isSelected = selectedValues.has(id)

    const handleSelect = () => {
        onSelect(id)
    }

    // Handle async loading when expanding/selecting
    // Currently, the Command component filters based on rendered items.
    // For async loading, we would typically need a more complex state management
    // or a custom implementation not relying solely on Command's filtering.
    // For now, this is a simplified view mainly handling display structure.

    return (
        <>
            <CommandItem
                value={label + ' ' + id} // Include ID for uniqueness in filtering
                onSelect={handleSelect}
                className='cursor-pointer'
            >
                <div
                    className='flex items-center gap-2 w-full'
                    style={{ paddingLeft: `${level * 1.5}rem` }}
                >
                    {isLoading ? (
                        <Loader2 className='h-4 w-4 shrink-0 animate-spin' />
                    ) : (
                        <Check
                            className={cn(
                                'h-4 w-4 shrink-0',
                                isSelected ? 'opacity-100' : 'opacity-0'
                            )}
                        />
                    )}
                    <span className='flex-1 truncate'>{label}</span>
                </div>
            </CommandItem>
            {children &&
                children.map((child) => (
                    <TreeItem
                        key={getId(child)}
                        item={child}
                        level={level + 1}
                        selectedValues={selectedValues}
                        onSelect={onSelect}
                        getChildren={getChildren}
                        getId={getId}
                        getLabel={getLabel}
                        onLoadChildren={onLoadChildren}
                        loadingIds={loadingIds}
                        setLoadingIds={setLoadingIds}
                    />
                ))}
        </>
    )
}

export function TreeSelect<T>({
    data,
    value,
    onChange,
    multiple = false,
    getChildren = defaultGetChildren as (item: T) => T[] | undefined,
    getId = defaultGetId as (item: T) => string,
    getLabel = defaultGetLabel as (item: T) => string,
    onLoadChildren,
    placeholder = 'Select...',
    searchPlaceholder = 'Search...',
    emptyText = 'No results found.',
    className,
    disabled = false,
}: TreeSelectProps<T>) {
    const [open, setOpen] = React.useState(false)
    const [loadingIds, setLoadingIds] = React.useState<Set<string>>(new Set())

    const selectedValues = React.useMemo(() => {
        if (!value) return new Set<string>()
        return new Set(Array.isArray(value) ? value : [value])
    }, [value])

    const handleSelect = (itemId: string) => {
        if (multiple) {
            const newSelected = new Set(selectedValues)
            if (newSelected.has(itemId)) {
                newSelected.delete(itemId)
            } else {
                newSelected.add(itemId)
            }
            onChange?.(Array.from(newSelected))
        } else {
            onChange?.(selectedValues.has(itemId) ? '' : itemId)
            setOpen(false)
        }
    }

    // Helper to find label for selected value
    // In a real optimized tree, we might need a lookup map.
    // Here we assume flattened traversal or similar is acceptable for display label finding.
    const findLabel = (id: string, items: T[]): string | undefined => {
        for (const item of items) {
            if (getId(item) === id) return getLabel(item)
            const children = getChildren(item)
            if (children) {
                const found = findLabel(id, children)
                if (found) return found
            }
        }
        return undefined
    }

    const displayValue = (() => {
        if (selectedValues.size === 0) return undefined
        if (multiple) {
            return Array.from(selectedValues).map((id) => ({
                id,
                label: findLabel(id, data),
            }))
        }
        const id = Array.from(selectedValues)[0]
        return findLabel(id, data)
    })()

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant='outline'
                    role='combobox'
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn('w-full justify-between', className)}
                >
                    {displayValue && typeof displayValue === 'string' ? (
                        <span className='truncate'>{displayValue}</span>
                    ) : displayValue && Array.isArray(displayValue) ? (
                        <div className='flex flex-wrap gap-1'>
                            {displayValue.map((item) => (
                                <Badge
                                    key={item.id}
                                    variant='secondary'
                                    className='mr-1 mb-1'
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleSelect(item.id)
                                    }}
                                >
                                    {item.label}
                                    <X className='ml-1 h-3 w-3 ring-offset-background hover:bg-muted rounded-full' />
                                </Badge>
                            ))}
                        </div>
                    ) : (
                        <span className='text-muted-foreground'>{placeholder}</span>
                    )}
                    <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                </Button>
            </PopoverTrigger>
            <PopoverContent className='w-[var(--radix-popover-trigger-width)] p-0'>
                <Command>
                    <CommandInput placeholder={searchPlaceholder} />
                    <CommandList>
                        <CommandEmpty>{emptyText}</CommandEmpty>
                        <CommandGroup>
                            {data.map((item) => (
                                <TreeItem
                                    key={getId(item)}
                                    item={item}
                                    level={0}
                                    selectedValues={selectedValues}
                                    onSelect={handleSelect}
                                    getChildren={getChildren}
                                    getId={getId}
                                    getLabel={getLabel}
                                    onLoadChildren={onLoadChildren}
                                    loadingIds={loadingIds}
                                    setLoadingIds={setLoadingIds}
                                />
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
