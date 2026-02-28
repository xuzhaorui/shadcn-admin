'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { type User } from '../data/schema'
import { useDeleteUserMutation } from '../hooks/use-user-list'

type UserDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: User
}

export function UsersDeleteDialog({ open, onOpenChange, currentRow }: UserDeleteDialogProps) {
  const [value, setValue] = useState('')
  const { mutate, isPending } = useDeleteUserMutation()

  const handleDelete = () => {
    if (value.trim() !== currentRow.username) return

    mutate(currentRow.id, {
      onSuccess: () => {
        setValue('')
        onOpenChange(false)
      },
    })
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(next) => {
        if (!isPending) onOpenChange(next)
      }}
      handleConfirm={handleDelete}
      disabled={value.trim() !== currentRow.username || isPending}
      title={
        <span className='text-destructive'>
          <AlertTriangle className='me-1 inline-block stroke-destructive' size={18} /> 删除用户
        </span>
      }
      desc={
        <div className='space-y-4'>
          <p className='mb-2'>
            确定要删除用户 <span className='font-bold'>{currentRow.username}</span>？
            <br />此操作将永久删除该用户且无法撤销。
          </p>

          <Label className='my-2'>
            用户名：
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder='请输入用户名确认删除'
            />
          </Label>

          <Alert variant='destructive'>
            <AlertTitle>警告：</AlertTitle>
            <AlertDescription>请谨慎操作，此操作无法撤销。</AlertDescription>
          </Alert>
        </div>
      }
      confirmText={isPending ? '删除中...' : '删除'}
      destructive
    />
  )
}
