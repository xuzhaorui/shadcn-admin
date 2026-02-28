'use client'

import { type ColumnDef } from '@tanstack/react-table'
import { Building2, ChevronDown, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { type Dept } from '../data/schema'

export const columns: ColumnDef<Dept>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all'
        className='translate-y-[2px]'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Select row'
        className='translate-y-[2px]'
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: '部门名称',
    cell: ({ row }) => (
      <div className='flex items-center gap-2' style={{ paddingLeft: `${row.depth * 2}rem` }}>
        {row.getCanExpand() ? (
          <button onClick={row.getToggleExpandedHandler()} style={{ cursor: 'pointer' }}>
            {row.getIsExpanded() ? <ChevronDown className='h-4 w-4' /> : <ChevronRight className='h-4 w-4' />}
          </button>
        ) : (
          <span className='w-4' />
        )}
        <Building2 className='h-4 w-4 text-blue-500' />
        <span className='font-medium'>{row.original.name}</span>
      </div>
    ),
    meta: { title: '部门名称' },
  },
  {
    accessorKey: 'code',
    header: '部门编码',
    cell: ({ row }) => (
      <code className='bg-muted rounded px-2 py-1 text-xs'>
        {row.original.code}
      </code>
    ),
    meta: { title: '部门编码' },
  },
  {
    accessorKey: 'sort',
    header: '排序',
    meta: { title: '排序' },
  },
  {
    accessorKey: 'status',
    header: '状态',
    cell: ({ row }) => {
      const status = row.original.status
      return (
        <Badge variant={status === 'active' ? 'default' : 'secondary'}>
          {status === 'active' ? '启用' : '禁用'}
        </Badge>
      )
    },
    meta: { title: '状态' },
  },
  {
    id: 'actions',
    header: '操作',
    cell: () => null,
    meta: { title: '操作' },
  },
  {
    id: 'drag-handle',
    header: '移动',
    enableHiding: false,
    cell: () => null,
  },
]
