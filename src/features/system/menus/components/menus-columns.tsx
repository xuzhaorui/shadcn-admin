'use client'

import { type ColumnDef } from '@tanstack/react-table'
import {
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Menu as MenuIcon,
  MousePointer2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { type Menu } from '../data/schema'

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'directory':
      return <FolderOpen className='h-4 w-4 text-amber-500' />
    case 'menu':
      return <MenuIcon className='h-4 w-4 text-blue-500' />
    case 'button':
      return <MousePointer2 className='h-4 w-4 text-green-500' />
    default:
      return null
  }
}

const getTypeBadge = (type: string) => {
  switch (type) {
    case 'directory':
      return (
        <Badge variant='outline' className='bg-amber-50 text-amber-700'>
          目录
        </Badge>
      )
    case 'menu':
      return (
        <Badge variant='outline' className='bg-blue-50 text-blue-700'>
          菜单
        </Badge>
      )
    case 'button':
      return (
        <Badge variant='outline' className='bg-green-50 text-green-700'>
          按钮
        </Badge>
      )
    default:
      return null
  }
}

export const columns: ColumnDef<Menu>[] = [
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
    header: '菜单名称',
    cell: ({ row }) => (
      <div className='flex items-center gap-2' style={{ paddingLeft: `${row.depth * 2}rem` }}>
        {row.getCanExpand() ? (
          <button onClick={row.getToggleExpandedHandler()} style={{ cursor: 'pointer' }}>
            {row.getIsExpanded() ? <ChevronDown className='h-4 w-4' /> : <ChevronRight className='h-4 w-4' />}
          </button>
        ) : (
          <span className='w-4' />
        )}
        {getTypeIcon(row.original.type)}
        <span className='font-medium'>{row.original.name}</span>
      </div>
    ),
    meta: { title: '菜单名称' },
  },
  {
    accessorKey: 'type',
    header: '类型',
    cell: ({ row }) => getTypeBadge(row.original.type),
    meta: { title: '类型' },
  },
  {
    accessorKey: 'path',
    header: '路径',
    cell: ({ row }) => {
      const path = row.original.path
      return path ? (
        <code className='bg-muted rounded px-2 py-1 text-xs'>{path}</code>
      ) : (
        <span className='text-muted-foreground'>-</span>
      )
    },
    meta: { title: '路径' },
  },
  {
    accessorKey: 'code',
    header: '菜单编码',
    cell: ({ row }) => (
      <code className='bg-muted rounded px-2 py-1 text-xs'>
        {row.original.code}
      </code>
    ),
    meta: { title: '菜单编码' },
  },
  {
    accessorKey: 'sort',
    header: '排序',
    meta: { title: '排序' },
  },
  {
    accessorKey: 'visible',
    header: '是否显示',
    cell: ({ row }) => (
      <Badge variant={row.original.visible ? 'default' : 'secondary'}>
        {row.original.visible ? '显示' : '隐藏'}
      </Badge>
    ),
    meta: { title: '是否显示' },
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
