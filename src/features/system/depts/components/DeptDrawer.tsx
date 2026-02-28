import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { type z } from 'zod'
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
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { type Dept, type DeptFormData, deptFormSchema } from '../data/schema'

interface DeptDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dept?: Dept | null
  defaultParentId?: string | null
  depts: Dept[]
  onSubmit: (data: DeptFormData) => void
  isLoading?: boolean
}

type DeptSelectItem = { id: string; name: string; level: number }
type DeptFormInput = z.input<typeof deptFormSchema>

function flattenDeptsForSelect(items: Dept[], level = 0): DeptSelectItem[] {
  let result: DeptSelectItem[] = []
  for (const item of items) {
    result.push({ id: item.id, name: item.name, level })
    if (item.children) {
      result = result.concat(flattenDeptsForSelect(item.children, level + 1))
    }
  }
  return result
}

export function DeptDrawer({
  open,
  onOpenChange,
  dept,
  defaultParentId = null,
  depts,
  onSubmit,
  isLoading = false,
}: DeptDrawerProps) {
  const isEdit = !!dept

  const form = useForm<DeptFormInput, unknown, DeptFormData>({
    resolver: zodResolver(deptFormSchema),
    defaultValues: {
      parentId: null,
      name: '',
      code: '',
      sort: 0,
      status: 'active',
    },
  })

  useEffect(() => {
    if (!open) return

    if (dept) {
      form.reset({
        parentId: dept.parentId,
        name: dept.name,
        code: dept.code,
        sort: dept.sort,
        status: dept.status,
      })
      return
    }

    form.reset({
      parentId: defaultParentId,
      name: '',
      code: '',
      sort: 0,
      status: 'active',
    })
  }, [defaultParentId, dept, form, open])

  const parentOptions = flattenDeptsForSelect(depts).filter((item) => item.id !== dept?.id)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑部门' : '新增部门'}</DialogTitle>
          <DialogDescription>{isEdit ? '修改部门信息' : '填写部门信息并保存'}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='parentId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>上级部门</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === 'null' ? null : value)}
                    value={field.value ?? 'null'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='选择上级部门' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='null'>根部门</SelectItem>
                      {parentOptions.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          <span style={{ paddingLeft: `${item.level * 16}px` }}>{item.name}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>部门名称</FormLabel>
                  <FormControl>
                    <Input placeholder='请输入部门名称' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='code'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>部门编码</FormLabel>
                  <FormControl>
                    <Input placeholder='请输入部门编码' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='sort'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>排序</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      placeholder='0'
                      value={field.value}
                      onChange={(e) => field.onChange(Number.parseInt(e.target.value || '0', 10) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='status'
              render={({ field }) => (
                <FormItem className='flex items-center justify-between rounded-md border p-3'>
                  <div>
                    <FormLabel>状态</FormLabel>
                    <p className='text-muted-foreground text-sm'>启用后部门可在系统中被选择</p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value === 'active'}
                      onCheckedChange={(checked) => field.onChange(checked ? 'active' : 'inactive')}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button type='submit' disabled={isLoading}>
                {isLoading ? '保存中...' : '保存'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
