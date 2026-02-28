import { X, UserMinus, UserPlus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface SelectionToolbarProps {
  selectedCount: number
  onClearSelection: () => void
  onBatchEnable?: () => void
  onBatchDisable?: () => void
  onBatchDelete?: () => void
}

export function SelectionToolbar({
  selectedCount,
  onClearSelection,
  onBatchEnable,
  onBatchDisable,
  onBatchDelete,
}: SelectionToolbarProps) {
  if (selectedCount === 0) return null

  return (
    <div className='fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl transition-all delay-100 duration-300 ease-out hover:scale-105'>
      <div className='bg-background border rounded-full shadow-lg px-4 py-2 flex items-center gap-2'>
        <Button variant='ghost' size='icon' className='h-8 w-8 rounded-full' onClick={onClearSelection}>
          <X className='h-4 w-4' />
        </Button>

        <span className='text-sm'>已选择 {selectedCount} 项角色</span>

        <div className='h-4 w-px bg-border mx-1' />

        {onBatchEnable ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant='ghost' size='icon' className='h-8 w-8 rounded-full' onClick={onBatchEnable}>
                <UserPlus className='h-4 w-4' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>启用所选角色</TooltipContent>
          </Tooltip>
        ) : null}

        {onBatchDisable ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant='ghost' size='icon' className='h-8 w-8 rounded-full' onClick={onBatchDisable}>
                <UserMinus className='h-4 w-4' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>停用所选角色</TooltipContent>
          </Tooltip>
        ) : null}

        {onBatchDelete ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                className='h-8 w-8 rounded-full text-destructive hover:text-destructive'
                onClick={onBatchDelete}
              >
                <Trash2 className='h-4 w-4' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>删除所选角色</TooltipContent>
          </Tooltip>
        ) : null}
      </div>
    </div>
  )
}
