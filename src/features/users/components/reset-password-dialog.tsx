'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { PasswordInput } from '@/components/password-input'
import { useResetPasswordMutation } from '../hooks/use-user-list'

const resetPasswordSchema = z
    .object({
        newPassword: z
            .string()
            .min(8, '密码长度至少 8 位')
            .max(20, '密码长度最多 20 位')
            .regex(/[a-zA-Z]/, '密码必须包含字母')
            .regex(/\d/, '密码必须包含数字'),
        confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: '两次密码输入不一致',
        path: ['confirmPassword'],
    })

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

type ResetPasswordDialogProps = {
    userId: string
    username: string
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ResetPasswordDialog({
    userId,
    username,
    open,
    onOpenChange,
}: ResetPasswordDialogProps) {
    const { mutate, isPending } = useResetPasswordMutation()

    const form = useForm<ResetPasswordFormData>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            newPassword: '',
            confirmPassword: '',
        },
    })

    const onSubmit = (values: ResetPasswordFormData) => {
        mutate(
            { id: userId, newPassword: values.newPassword },
            {
                onSuccess: () => {
                    form.reset()
                    onOpenChange(false)
                },
            }
        )
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(state) => {
                if (!isPending) {
                    form.reset()
                    onOpenChange(state)
                }
            }}
        >
            <DialogContent className='sm:max-w-md'>
                <DialogHeader>
                    <DialogTitle>重置密码</DialogTitle>
                    <DialogDescription>
                        为用户 <span className='font-semibold'>{username}</span> 重置密码
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form
                        id='reset-password-form'
                        onSubmit={form.handleSubmit(onSubmit)}
                        className='space-y-4'
                    >
                        <FormField
                            control={form.control}
                            name='newPassword'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>新密码</FormLabel>
                                    <FormControl>
                                        <PasswordInput
                                            placeholder='请输入新密码 (8-20位,包含字母和数字)'
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name='confirmPassword'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>确认密码</FormLabel>
                                    <FormControl>
                                        <PasswordInput
                                            placeholder='请再次输入新密码'
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </form>
                </Form>
                <DialogFooter>
                    <Button
                        variant='outline'
                        onClick={() => onOpenChange(false)}
                        disabled={isPending}
                    >
                        取消
                    </Button>
                    <Button type='submit' form='reset-password-form' disabled={isPending}>
                        {isPending ? '重置中...' : '确认重置'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
