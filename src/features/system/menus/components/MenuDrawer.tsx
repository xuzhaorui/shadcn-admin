import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { type Menu, type MenuFormData, menuFormSchema } from '../data/schema'
import { IconPicker } from './IconPicker'

interface MenuDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    menu?: Menu | null
    defaultParentId?: string | null
    menus: Menu[]
    onSubmit: (data: MenuFormData) => void
    isLoading?: boolean
}

/**
 * Helper: Flatten menu tree for parent selection
 */
function flattenMenusForSelect(menus: Menu[], level = 0): Array<{ id: string; name: string; level: number; type: string }> {
    let result: Array<{ id: string; name: string; level: number; type: string }> = []
    for (const menu of menus) {
        // Only directories and menus can be parents
        if (menu.type !== 'button') {
            result.push({
                id: menu.id,
                name: menu.name,
                level,
                type: menu.type,
            })
        }
        if (menu.children) {
            result = result.concat(flattenMenusForSelect(menu.children, level + 1))
        }
    }
    return result
}

export function MenuDrawer({
    open,
    onOpenChange,
    menu,
    defaultParentId = null,
    menus,
    onSubmit,
    isLoading = false,
}: MenuDrawerProps) {
    const isEdit = !!menu

    const form = useForm<MenuFormData>({
        defaultValues: {
            parentId: null,
            type: 'menu',
            name: '',
            code: '',
            path: '',
            icon: '',
            sort: 0,
            visible: true,
        },
    })

    const watchType = form.watch('type')

    // Reset form when drawer opens/closes or menu changes
    useEffect(() => {
        if (open && menu) {
            form.reset({
                parentId: menu.parentId,
                type: menu.type,
                name: menu.name,
                code: menu.code,
                path: menu.path || '',
                icon: menu.icon || '',
                sort: menu.sort,
                visible: menu.visible,
            })
        } else if (open && !menu) {
            form.reset({
                parentId: defaultParentId,
                type: 'menu',
                name: '',
                code: '',
                path: '',
                icon: '',
                sort: 0,
                visible: true,
            })
        }
    }, [defaultParentId, open, menu, form])

    const handleSubmit = (data: MenuFormData) => {
        const parsed = menuFormSchema.safeParse(data)
        if (!parsed.success) {
            toast.error(parsed.error.issues[0]?.message || '表单校验失败')
            return
        }
        onSubmit(parsed.data)
        onOpenChange(false)
    }

    const parentOptions = flattenMenusForSelect(menus).filter(
        (m) => m.id !== menu?.id // Prevent selecting self as parent
    )

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEdit ? '编辑菜单' : '新增菜单'}</DialogTitle>
                    <DialogDescription>
                        {isEdit ? '修改菜单信息' : '填写菜单信息并提交'}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="px-4">
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                            {/* Parent Menu */}
                            <FormField
                                control={form.control}
                                name="parentId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>上级菜单</FormLabel>
                                        <Select
                                            onValueChange={(value) =>
                                                field.onChange(value === 'null' ? null : value)
                                            }
                                            value={field.value || 'null'}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="选择上级菜单" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="null">根目录</SelectItem>
                                                {parentOptions.map((option) => (
                                                    <SelectItem key={option.id} value={option.id}>
                                                        <span style={{ paddingLeft: `${option.level * 16}px` }}>
                                                            {option.name}
                                                        </span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Menu Type */}
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>菜单类型</FormLabel>
                                        <FormControl>
                                            <RadioGroup
                                                onValueChange={field.onChange}
                                                value={field.value}
                                                className="flex gap-4"
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="directory" id="directory" />
                                                    <label htmlFor="directory" className="cursor-pointer">
                                                        目录
                                                    </label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="menu" id="menu" />
                                                    <label htmlFor="menu" className="cursor-pointer">
                                                        菜单
                                                    </label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="button" id="button" />
                                                    <label htmlFor="button" className="cursor-pointer">
                                                        按钮
                                                    </label>
                                                </div>
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Menu Name */}
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>菜单名称</FormLabel>
                                        <FormControl>
                                            <Input placeholder="请输入菜单名称" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Menu Code */}
                            <FormField
                                control={form.control}
                                name="code"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>菜单编码</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="例如: system:users"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Route Path - Hidden for buttons */}
                            {watchType !== 'button' && (
                                <FormField
                                    control={form.control}
                                    name="path"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>路由路径</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="例如: /system/users"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            {/* Icon */}
                            <FormField
                                control={form.control}
                                name="icon"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>图标</FormLabel>
                                        <FormControl>
                                            <IconPicker
                                                value={field.value}
                                                onChange={field.onChange}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Sort Order */}
                            <FormField
                                control={form.control}
                                name="sort"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>排序值</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="0"
                                                {...field}
                                                onChange={(e) =>
                                                    field.onChange(parseInt(e.target.value) || 0)
                                                }
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Visible */}
                            <FormField
                                control={form.control}
                                name="visible"
                                render={({ field }) => (
                                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                                        <div>
                                            <FormLabel>是否显示</FormLabel>
                                            <p className="text-sm text-muted-foreground">
                                                控制菜单是否在导航中显示
                                            </p>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? '提交中...' : '提交'}
                            </Button>
                            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                                取消
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
