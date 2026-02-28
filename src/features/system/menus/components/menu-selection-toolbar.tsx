import { useState } from 'react'
import { Eye, EyeOff, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
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

interface MenuSelectionToolbarProps {
  selectedCount: number
  onClearSelection: () => void
  onBatchShow: () => Promise<void> | void
  onBatchHide: () => Promise<void> | void
  onBatchDelete: () => Promise<void> | void
  canEdit: boolean
  canDelete: boolean
}

export function MenuSelectionToolbar({
  selectedCount,
  onClearSelection,
  onBatchShow,
  onBatchHide,
  onBatchDelete,
  canEdit,
  canDelete,
}: MenuSelectionToolbarProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  if (selectedCount === 0) return null

  return (
    <>
      <div className='fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl transition-all delay-100 duration-300 ease-out hover:scale-105'>
        <div className='bg-background border rounded-full shadow-lg px-4 py-2 flex items-center gap-2'>
          <Button variant='ghost' size='icon' className='h-8 w-8 rounded-full' onClick={onClearSelection}>
            <X className='h-4 w-4' />
          </Button>

          <span className='text-sm'>已选择 {selectedCount} 项菜单</span>

          <div className='h-4 w-px bg-border mx-1' />

          {canEdit ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant='ghost' size='icon' className='h-8 w-8 rounded-full' onClick={onBatchShow}>
                  <Eye className='h-4 w-4' />
                </Button>
              </TooltipTrigger>
              <TooltipContent>显示所选菜单</TooltipContent>
            </Tooltip>
          ) : null}

          {canEdit ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant='ghost' size='icon' className='h-8 w-8 rounded-full' onClick={onBatchHide}>
                  <EyeOff className='h-4 w-4' />
                </Button>
              </TooltipTrigger>
              <TooltipContent>隐藏所选菜单</TooltipContent>
            </Tooltip>
          ) : null}

          {canDelete ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8 rounded-full text-destructive hover:text-destructive'
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className='h-4 w-4' />
                </Button>
              </TooltipTrigger>
              <TooltipContent>删除所选菜单</TooltipContent>
            </Tooltip>
          ) : null}
        </div>
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除所选菜单？</AlertDialogTitle>
            <AlertDialogDescription>
              将删除已选择的 {selectedCount} 项菜单，此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await onBatchDelete()
                setShowDeleteConfirm(false)
              }}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
