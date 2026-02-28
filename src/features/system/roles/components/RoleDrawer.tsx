import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet'
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { DepartmentTreeSelect } from '@/components/department-tree-select'
import { useRoles } from './roles-provider'
import { useCreateRole, useUpdateRole } from '../hooks/useRoleMutations'
import { roleFormSchema, type RoleFormData } from '../data/schema'
import { dataScopeOptions } from '../data/data'

export function RoleDrawer() {
    const { open, setOpen, currentRow, setCurrentRow } = useRoles()
    const createMutation = useCreateRole()
    const updateMutation = useUpdateRole()

    const isEdit = open === 'edit'
    const isOpen = open === 'add' || open === 'edit'

    const form = useForm<RoleFormData>({
        resolver: zodResolver(roleFormSchema),
        defaultValues: {
            code: '',
            name: '',
            dataScope: 'all',
            customDeptIds: [],
            status: 'active',
        },
    })

    const dataScope = form.watch('dataScope')
    const showDeptSelector = dataScope === 'custom'

    // Reset form when dialog opens/closes
    useEffect(() => {
        if (isOpen && currentRow && isEdit) {
            form.reset({
                code: currentRow.code,
                name: currentRow.name,
                dataScope: currentRow.dataScope,
                customDeptIds: currentRow.customDeptIds || [],
                status: currentRow.status,
            })
        } else if (isOpen && !isEdit) {
            form.reset({
                code: '',
                name: '',
                dataScope: 'all',
                customDeptIds: [],
                status: 'active',
            })
        }
    }, [isOpen, currentRow, isEdit, form])

    const onSubmit = (values: RoleFormData) => {
        if (isEdit && currentRow) {
            updateMutation.mutate(
                { id: currentRow.id, data: values },
                {
                    onSuccess: () => {
                        handleClose()
                    },
                }
            )
        } else {
            createMutation.mutate(values, {
                onSuccess: () => {
                    handleClose()
                },
            })
        }
    }

    const handleClose = () => {
        form.reset()
        setCurrentRow(null)
        setOpen(null)
    }

    const isSubmitting = createMutation.isPending || updateMutation.isPending

    return (
        <Sheet open={isOpen} onOpenChange={(v) => !v && handleClose()}>
            <SheetContent className="sm:max-w-[540px] overflow-y-auto pl-8">
                <SheetHeader>
                    <SheetTitle>{isEdit ? '编辑角色' : '新增角色'}</SheetTitle>
                    <SheetDescription>
                        {isEdit ? '更新以下角色信息' : '填写以下信息创建新角色'}
                    </SheetDescription>
                </SheetHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                        <FormField
                            control={form.control}
                            name="code"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>角色编码 *</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="请输入角色编码（小写字母、数字和下划线）"
                                            {...field}
                                            disabled={isEdit}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>角色名称 *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="请输入角色名称" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* 数据权限 5 档 */}
                        <FormField
                            control={form.control}
                            name="dataScope"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                    <FormLabel>数据权限 *</FormLabel>
                                    <FormControl>
                                        <RadioGroup
                                            onValueChange={field.onChange}
                                            value={field.value}
                                            className="flex flex-col space-y-1"
                                        >
                                            {dataScopeOptions.map((option) => (
                                                <div
                                                    key={option.value}
                                                    className="flex items-center space-x-2"
                                                >
                                                    <RadioGroupItem
                                                        value={option.value}
                                                        id={option.value}
                                                    />
                                                    <Label
                                                        htmlFor={option.value}
                                                        className="font-normal cursor-pointer"
                                                    >
                                                        {option.label}
                                                    </Label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* 自定义数据权限 - 部门选择器 */}
                        {showDeptSelector && (
                            <FormField
                                control={form.control}
                                name="customDeptIds"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>可访问部门 *</FormLabel>
                                        <FormControl>
                                            <div className='space-y-2'>
                                                <DepartmentTreeSelect
                                                    multiple
                                                    value={field.value ?? []}
                                                    onValueChange={(value) =>
                                                        field.onChange(
                                                            Array.isArray(value)
                                                                ? value
                                                                : value
                                                                  ? [value]
                                                                  : []
                                                        )
                                                    }
                                                    placeholder='选择可访问部门'
                                                />
                                                <p className='text-muted-foreground text-xs'>
                                                    当前选中: {field.value?.length || 0} 个部门
                                                </p>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>状态</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
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
                        <SheetFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                disabled={isSubmitting}
                            >
                                取消
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? '提交中...' : isEdit ? '更新' : '创建'}
                            </Button>
                        </SheetFooter>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    )
}
