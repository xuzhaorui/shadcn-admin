import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { toast } from 'sonner'
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
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { useRoles } from './roles-provider'

const formSchema = z.object({
    name: z.string().min(1, '请输入角色名称'),
    code: z.string().min(1, '请输入角色编码'),
    status: z.enum(['active', 'inactive']),
})

type FormValues = z.infer<typeof formSchema>

export function RolesActionDialog() {
    const { open, setOpen, currentRow, setCurrentRow } = useRoles()

    const isEdit = open === 'edit'
    const isOpen = open === 'add' || open === 'edit'

    const form = useForm<FormValues>({
        defaultValues: isEdit && currentRow
            ? {
                name: currentRow.name,
                code: currentRow.code,
                status: currentRow.status,
            }
            : {
                name: '',
                code: '',
                status: 'active',
            },
    })

    const onSubmit = (values: FormValues) => {
        const parsed = formSchema.safeParse(values)
        if (!parsed.success) {
            toast.error(parsed.error.issues[0]?.message || '表单校验失败')
            return
        }
        toast.success(isEdit ? '角色更新成功' : '角色创建成功')
        handleClose()
    }

    const handleClose = () => {
        form.reset()
        setCurrentRow(null)
        setOpen(null)
    }

    return (
        <Dialog open={isOpen} onOpenChange={(v) => !v && handleClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEdit ? '编辑角色' : '新增角色'}</DialogTitle>
                    <DialogDescription>
                        {isEdit
                            ? '更新以下角色信息'
                            : '填写以下信息创建新角色'}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>角色名称</FormLabel>
                                    <FormControl>
                                        <Input placeholder="请输入角色名称" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="code"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>角色编码</FormLabel>
                                    <FormControl>
                                        <Input placeholder="请输入角色编码" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>状态</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="选择状态" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="active">启用</SelectItem>
                                            <SelectItem value="inactive">停用</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleClose}>
                                取消
                            </Button>
                            <Button type="submit">{isEdit ? '更新' : '创建'}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
