import { useState } from 'react'
import { type Table } from '@tanstack/react-table'
import { Trash2, UserX, UserCheck, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { DataTableBulkActions as BulkActionsToolbar } from '@/components/data-table'
import { usePermission } from '@/hooks/use-permission'
import { type User } from '../data/schema'
import { USER_PERMISSIONS } from '../constants/permissions'
import { UsersMultiDeleteDialog } from './users-multi-delete-dialog'
import { useToggleUserStatusMutation } from '../hooks/use-user-list'

type DataTableBulkActionsProps<TData> = {
  table: Table<TData>
}

export function DataTableBulkActions<TData>({ table }: DataTableBulkActionsProps<TData>) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const { mutateAsync, isPending } = useToggleUserStatusMutation()
  const { can } = usePermission()
  const canEdit = can(USER_PERMISSIONS.EDIT)
  const canDelete = can(USER_PERMISSIONS.DELETE)
  const canCreate = can(USER_PERMISSIONS.CREATE)

  const handleBulkStatusChange = async (status: 'active' | 'inactive') => {
    const selectedUsers = selectedRows.map((row) => row.original as User)
    try {
      await Promise.all(
        selectedUsers.map((user) =>
          mutateAsync({
            id: user.id,
            status,
          })
        )
      )
      table.resetRowSelection()
      toast.success(`已${status === 'active' ? '启用' : '禁用'} ${selectedUsers.length} 位用户`)
    } catch {
      toast.error('批量状态更新失败，请稍后重试')
    }
  }

  return (
    <>
      <BulkActionsToolbar table={table} entityName='用户'>
        {canCreate ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='outline'
                size='icon'
                onClick={() => toast.info('批量邀请接口未实现')}
                className='size-8'
                aria-label='邀请所选用户'
                title='邀请所选用户'
              >
                <Mail />
                <span className='sr-only'>邀请所选用户</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>邀请所选用户</p>
            </TooltipContent>
          </Tooltip>
        ) : null}

        {canEdit ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='outline'
                size='icon'
                onClick={() => handleBulkStatusChange('active')}
                className='size-8'
                aria-label='启用所选用户'
                title='启用所选用户'
                disabled={isPending}
              >
                <UserCheck />
                <span className='sr-only'>启用所选用户</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>启用所选用户</p>
            </TooltipContent>
          </Tooltip>
        ) : null}

        {canEdit ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='outline'
                size='icon'
                onClick={() => handleBulkStatusChange('inactive')}
                className='size-8'
                aria-label='禁用所选用户'
                title='禁用所选用户'
                disabled={isPending}
              >
                <UserX />
                <span className='sr-only'>禁用所选用户</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>禁用所选用户</p>
            </TooltipContent>
          </Tooltip>
        ) : null}

        {canDelete ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='destructive'
                size='icon'
                onClick={() => setShowDeleteConfirm(true)}
                className='size-8'
                aria-label='删除所选用户'
                title='删除所选用户'
              >
                <Trash2 />
                <span className='sr-only'>删除所选用户</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>删除所选用户</p>
            </TooltipContent>
          </Tooltip>
        ) : null}
      </BulkActionsToolbar>

      {canDelete ? (
        <UsersMultiDeleteDialog table={table} open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm} />
      ) : null}
    </>
  )
}
