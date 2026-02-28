import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table/column-header'
import { type Role } from '../data/schema'
import { dataScopeOptions } from '../data/data'
import { DataTableRowActions } from './data-table-row-actions'

export const rolesColumns: ColumnDef<Role>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='全选'
        className='translate-y-[2px]'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        disabled={!row.getCanSelect()}
        aria-label='选择行'
        className='translate-y-[2px]'
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title='角色名称' />,
    cell: ({ row }) => <span className='font-medium'>{row.getValue('name')}</span>,
  },
  {
    accessorKey: 'code',
    header: ({ column }) => <DataTableColumnHeader column={column} title='角色编码' />,
    cell: ({ row }) => (
      <code className='bg-muted rounded px-2 py-1 text-xs'>{row.getValue('code')}</code>
    ),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title='状态' />,
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      return <Badge variant={status === 'active' ? 'default' : 'secondary'}>{status === 'active' ? '启用' : '停用'}</Badge>
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: 'dataScope',
    header: ({ column }) => <DataTableColumnHeader column={column} title='数据权限' />,
    cell: ({ row }) => {
      const dataScope = row.getValue('dataScope') as string
      const customDeptIds = row.original.customDeptIds
      const option = dataScopeOptions.find((opt) => opt.value === dataScope)
      return (
        <div className='flex items-center gap-1'>
          <Badge variant='outline'>{option?.label || dataScope}</Badge>
          {dataScope === 'custom' && customDeptIds && (
            <span className='text-muted-foreground text-xs'>({customDeptIds.length}个部门)</span>
          )}
        </div>
      )
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]
