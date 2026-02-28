import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { type Row } from '@tanstack/react-table'
import { Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react'
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
import { type Menu } from '../data/schema'
import { useDeleteMenu, useUpdateMenu } from '../hooks/useMenuMutations'

interface MenuRowActionsProps {
  row: Row<Menu>
  onEdit: (menu: Menu) => void
  onAddChild: (menu: Menu) => void
}

export function MenuRowActions({ row, onEdit, onAddChild }: MenuRowActionsProps) {
  const menu = row.original
  const { can } = usePermission()
  const canCreate = can('system:menus:create')
  const canEdit = can('system:menus:edit')
  const canDelete = can('system:menus:delete')
  const { mutate: updateMenu } = useUpdateMenu()
  const { mutate: deleteMenu } = useDeleteMenu()
  const [showVisibleConfirm, setShowVisibleConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  if (!canCreate && !canEdit && !canDelete) return null

  const toggleVisible = () => {
    updateMenu({
      id: menu.id,
      data: {
        parentId: menu.parentId,
        type: menu.type,
        name: menu.name,
        code: menu.code,
        path: menu.path,
        icon: menu.icon,
        sort: menu.sort,
        visible: !menu.visible,
      },
    })
    setShowVisibleConfirm(false)
  }

  const confirmDelete = () => {
    deleteMenu(menu.id)
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
            <DropdownMenuItem onClick={() => onAddChild(menu)}>
              添加子菜单
              <DropdownMenuShortcut>
                <Plus size={16} />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          ) : null}
          {canEdit ? (
            <DropdownMenuItem onClick={() => onEdit(menu)}>
              编辑
              <DropdownMenuShortcut>
                <Pencil size={16} />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          ) : null}
          {canEdit ? (
            <DropdownMenuItem onClick={() => setShowVisibleConfirm(true)}>
              {menu.visible ? '隐藏' : '显示'}
              <DropdownMenuShortcut>
                {menu.visible ? <EyeOff size={16} /> : <Eye size={16} />}
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          ) : null}
          {canDelete ? <DropdownMenuSeparator /> : null}
          {canDelete ? (
            <DropdownMenuItem
              onClick={() => setShowDeleteConfirm(true)}
              className='text-red-500 focus:text-red-500'
            >
              删除
              <DropdownMenuShortcut>
                <Trash2 size={16} />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      {canEdit ? (
        <AlertDialog open={showVisibleConfirm} onOpenChange={setShowVisibleConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认{menu.visible ? '隐藏' : '显示'}菜单？</AlertDialogTitle>
              <AlertDialogDescription>
                菜单 <span className='font-semibold'>{menu.name}</span> 将被{menu.visible ? '隐藏' : '显示'}。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction onClick={toggleVisible}>确认</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}

      {canDelete ? (
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认删除菜单？</AlertDialogTitle>
              <AlertDialogDescription>
                将删除菜单 <span className='font-semibold'>{menu.name}</span>。
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
