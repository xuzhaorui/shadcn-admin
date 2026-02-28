import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { type Row } from '@tanstack/react-table'
import { Trash2, UserPen, KeyRound, UserCheck, UserX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { usePermission } from '@/hooks/use-permission'
import { type User } from '../data/schema'
import { USER_PERMISSIONS } from '../constants/permissions'
import { useUsers } from './users-provider'
import { useToggleUserStatusMutation } from '../hooks/use-user-list'
import { useState } from 'react'
import { isProtectedUser } from '../lib/is-protected-user'

type DataTableRowActionsProps = {
  row: Row<User>
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const { setOpen, setCurrentRow } = useUsers()
  const { mutate: toggleStatus } = useToggleUserStatusMutation()
  const { can } = usePermission()
  const [showStatusConfirm, setShowStatusConfirm] = useState(false)

  const user = row.original
  const isActive = user.status === 'active'
  const isProtected = isProtectedUser(user)
  const canEdit = can(USER_PERMISSIONS.EDIT)
  const canDelete = can(USER_PERMISSIONS.DELETE)
  const canResetPassword = can(USER_PERMISSIONS.RESET_PWD)
  const hasAnyAction = canEdit || canDelete || canResetPassword

  const handleToggleStatus = () => {
    if (isProtected || !canEdit) return
    toggleStatus({
      id: user.id,
      status: isActive ? 'inactive' : 'active',
    })
    setShowStatusConfirm(false)
  }

  return (
    <>
      {isProtected || !hasAnyAction ? null : (
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            className='flex h-8 w-8 p-0 data-[state=open]:bg-muted'
          >
            <DotsHorizontalIcon className='h-4 w-4' />
            <span className='sr-only'>打开菜单</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-[160px]'>
          {canEdit ? (
            <DropdownMenuItem
              onClick={() => {
                setCurrentRow(row.original)
                setOpen('edit')
              }}
            >
              编辑
              <DropdownMenuShortcut>
                <UserPen size={16} />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          ) : null}

          {canEdit ? (
            <DropdownMenuItem
              onClick={() => setShowStatusConfirm(true)}
            >
              {isActive ? '禁用' : '启用'}
              <DropdownMenuShortcut>
                {isActive ? <UserX size={16} /> : <UserCheck size={16} />}
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          ) : null}

          {canResetPassword ? (
            <DropdownMenuItem
              onClick={() => {
                setCurrentRow(row.original)
                setOpen('resetPassword')
              }}
            >
              重置密码
              <DropdownMenuShortcut>
                <KeyRound size={16} />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          ) : null}

          {canDelete ? <DropdownMenuSeparator /> : null}

          {canDelete ? (
            <DropdownMenuItem
              onClick={() => {
                setCurrentRow(row.original)
                setOpen('delete')
              }}
              className='text-red-500!'
            >
              删除
              <DropdownMenuShortcut>
                <Trash2 size={16} />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
      )}

      <AlertDialog open={showStatusConfirm && canEdit} onOpenChange={setShowStatusConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认{isActive ? '禁用' : '启用'}用户？</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要{isActive ? '禁用' : '启用'}用户 <span className='font-semibold'>{user.username}</span> 吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleStatus}>
              确认
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
