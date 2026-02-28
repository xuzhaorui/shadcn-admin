import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { type Row } from '@tanstack/react-table'
import { Building, Building2, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { usePermission } from '@/hooks/use-permission'
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
import { type Dept } from '../data/schema'
import { useDeleteDept, useToggleDeptStatus } from '../hooks/useDeptMutations'

interface DeptRowActionsProps {
  row: Row<Dept>
  onEdit: (dept: Dept) => void
  onAddChild: (dept: Dept) => void
}

export function DeptRowActions({ row, onEdit, onAddChild }: DeptRowActionsProps) {
  const dept = row.original
  const { can } = usePermission()
  const canCreate = can('system:departments:create')
  const canEdit = can('system:departments:edit')
  const canDelete = can('system:departments:delete')
  const isActive = dept.status === 'active'
  const { mutate: toggleStatus } = useToggleDeptStatus()
  const { mutate: deleteDept } = useDeleteDept()
  const [showStatusConfirm, setShowStatusConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  if (!canCreate && !canEdit && !canDelete) return null

  const confirmToggle = () => {
    toggleStatus({
      id: dept.id,
      status: isActive ? 'inactive' : 'active',
    })
    setShowStatusConfirm(false)
  }

  const confirmDelete = () => {
    deleteDept(dept.id)
    setShowDeleteConfirm(false)
  }

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='flex h-8 w-8 p-0 data-[state=open]:bg-muted'>
            <DotsHorizontalIcon className='h-4 w-4' />
            <span className='sr-only'>打开菜单</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-[170px]'>
          {canCreate ? (
            <DropdownMenuItem onClick={() => onAddChild(dept)}>
              添加子部门
              <DropdownMenuShortcut>
                <Plus size={16} />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          ) : null}
          {canEdit ? (
            <DropdownMenuItem onClick={() => onEdit(dept)}>
              编辑
              <DropdownMenuShortcut>
                <Pencil size={16} />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          ) : null}
          {canEdit ? (
            <DropdownMenuItem onClick={() => setShowStatusConfirm(true)}>
              {isActive ? '禁用' : '启用'}
              <DropdownMenuShortcut>
                {isActive ? <Building2 size={16} /> : <Building size={16} />}
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          ) : null}
          {canDelete ? <DropdownMenuSeparator /> : null}
          {canDelete ? (
            <DropdownMenuItem onClick={() => setShowDeleteConfirm(true)} className='text-red-500 focus:text-red-500'>
              删除
              <DropdownMenuShortcut>
                <Trash2 size={16} />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      {canEdit ? (
        <AlertDialog open={showStatusConfirm} onOpenChange={setShowStatusConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认{isActive ? '禁用' : '启用'}部门？</AlertDialogTitle>
              <AlertDialogDescription>
                部门 <span className='font-semibold'>{dept.name}</span> 将被{isActive ? '禁用' : '启用'}。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction onClick={confirmToggle}>确认</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}

      {canDelete ? (
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认删除部门？</AlertDialogTitle>
              <AlertDialogDescription>
                将删除部门 <span className='font-semibold'>{dept.name}</span>。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>删除</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </>
  )
}
