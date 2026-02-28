import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import { callTypes, userStatuses } from '../data/data'
import { type User } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'

export function createUsersColumns(roleNameMap: Record<string, string>): ColumnDef<User>[] {
  return [
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
    meta: {
      className: cn('max-md:sticky start-0 z-10 rounded-tl-[inherit]'),
    },
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
    accessorKey: 'username',
    header: ({ column }) => <DataTableColumnHeader column={column} title='用户名' />,
    cell: ({ row }) => <LongText className='max-w-36 ps-3'>{row.getValue('username')}</LongText>,
    meta: {
      className: cn(
        'drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)]',
        'ps-0.5 max-md:sticky start-6 @4xl/content:table-cell @4xl/content:drop-shadow-none'
      ),
      title: '用户名',
    },
    enableHiding: true,
  },
  {
    accessorKey: 'realName',
    header: ({ column }) => <DataTableColumnHeader column={column} title='真实姓名' />,
    cell: ({ row }) => {
      const realName = row.getValue('realName') as string
      return <LongText className='max-w-36'>{realName}</LongText>
    },
    meta: { className: 'w-36', title: '真实姓名' },
    enableHiding: true,
  },
  {
    accessorKey: 'email',
    header: ({ column }) => <DataTableColumnHeader column={column} title='邮箱' />,
    cell: ({ row }) => <div className='w-fit ps-2 text-nowrap'>{row.getValue('email')}</div>,
    meta: { title: '邮箱' },
  },
  {
    accessorKey: 'phone',
    header: ({ column }) => <DataTableColumnHeader column={column} title='手机号' />,
    cell: ({ row }) => {
      const phone = row.getValue('phone') as string | undefined
      return <div>{phone || '-'}</div>
    },
    enableSorting: false,
    meta: { title: '手机号' },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title='状态' />,
    cell: ({ row }) => {
      const { status } = row.original
      const badgeColor = callTypes.get(status)
      const statusLabel = userStatuses.find((s) => s.value === status)?.label || status

      return (
        <div className='flex space-x-2'>
          <Badge variant='outline' className={cn('capitalize', badgeColor)}>
            {statusLabel}
          </Badge>
        </div>
      )
    },
    meta: { title: '状态' },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    enableHiding: true,
    enableSorting: false,
  },
  {
    accessorKey: 'roleIds',
    header: ({ column }) => <DataTableColumnHeader column={column} title='角色' />,
    cell: ({ row }) => {
      const { roleIds } = row.original
      if (!roleIds || roleIds.length === 0) {
        return <span className='text-muted-foreground'>未分配</span>
      }
      const displayRoles = roleIds.slice(0, 3)
      const remainingCount = roleIds.length - 3

      return (
        <div className='flex items-center gap-1 flex-wrap'>
          {displayRoles.map((roleId, index) => (
            <Badge key={index} variant='secondary' className='text-xs'>
              {roleNameMap[roleId] || roleId}
            </Badge>
          ))}
          {remainingCount > 0 && (
            <Badge variant='outline' className='text-xs'>
              +{remainingCount}
            </Badge>
          )}
        </div>
      )
    },
    filterFn: (row, id, value) => {
      const roleIds = row.getValue(id) as string[]
      return value.some((v: string) => roleIds.includes(v))
    },
    enableSorting: false,
    enableHiding: true,
    meta: { title: '角色' },
  },
  {
    accessorKey: 'departmentId',
    header: ({ column }) => <DataTableColumnHeader column={column} title='部门' />,
    cell: ({ row }) => {
      const { departmentId } = row.original
      if (!departmentId) {
        return <span className='text-muted-foreground'>未分配</span>
      }
      return <span>{departmentId}</span>
    },
    enableSorting: false,
    enableHiding: true,
    meta: { title: '部门' },
  },
  {
    id: 'actions',
    cell: DataTableRowActions,
  },
  ]
}
