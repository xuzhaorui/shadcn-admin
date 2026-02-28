'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
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
import { PasswordInput } from '@/components/password-input'
import { TreeSelect } from '@/components/tree-select'
import { DepartmentTreeSelect } from '@/components/department-tree-select'
import { Switch } from '@/components/ui/switch'
import { type User, userFormSchema, type UserFormData } from '../data/schema'
import { useUserMutation } from '../hooks/use-user-list'
import { type UserCreateData } from '../api/user-api'
import { roleApi } from '@/features/system/roles/api/role-api'

type UserActionDialogProps = {
  currentRow?: User
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UsersActionDialog({ currentRow, open, onOpenChange }: UserActionDialogProps) {
  const isEdit = !!currentRow
  const { mutate, isPending } = useUserMutation()

  const { data: rolePage } = useQuery({
    queryKey: ['users', 'role-options'],
    queryFn: () => roleApi.getRoleList({ page: 1, pageSize: 200 }),
    staleTime: 1000 * 60 * 5,
  })

  const roleOptions = (rolePage?.list || []).map((role) => ({
    id: role.id,
    name: role.name,
    children: [],
  }))

  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: '',
      realName: '',
      email: '',
      phone: '',
      departmentId: '',
      roleIds: [],
      status: 'active',
      password: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    if (currentRow && open) {
      form.reset({
        username: currentRow.username,
        realName: currentRow.realName,
        email: currentRow.email,
        phone: currentRow.phone || '',
        departmentId: currentRow.departmentId,
        roleIds: currentRow.roleIds,
        status: currentRow.status,
        password: '',
        confirmPassword: '',
      })
    } else if (!currentRow && open) {
      form.reset({
        username: '',
        realName: '',
        email: '',
        phone: '',
        departmentId: '',
        roleIds: [],
        status: 'active',
        password: '',
        confirmPassword: '',
      })
    }
  }, [currentRow, open, form])

  const onSubmit = (values: UserFormData) => {
    const submitData: UserCreateData = {
      username: values.username,
      realName: values.realName,
      email: values.email,
      phone: values.phone || undefined,
      departmentId: values.departmentId,
      roleIds: values.roleIds,
      status: values.status,
    }

    if (!isEdit || (values.password && values.password.length > 0)) {
      submitData.password = values.password
    }

    mutate(
      { id: currentRow?.id, data: submitData },
      {
        onSuccess: () => {
          form.reset()
          onOpenChange(false)
        },
      }
    )
  }

  const isPasswordTouched = !!form.formState.dirtyFields.password

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
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader className='text-start'>
          <DialogTitle>{isEdit ? '编辑用户' : '新增用户'}</DialogTitle>
          <DialogDescription>{isEdit ? '在此更新用户信息。' : '在此创建新用户。'} 完成后点击“保存”。</DialogDescription>
        </DialogHeader>
        <div className='h-105 w-[calc(100%+0.75rem)] overflow-y-auto py-1 pe-3'>
          <Form {...form}>
            <form id='user-form' onSubmit={form.handleSubmit(onSubmit)} className='space-y-4 px-0.5'>
              <FormField
                control={form.control}
                name='username'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>用户名 *</FormLabel>
                    <FormControl>
                      <Input placeholder='请输入用户名' className='col-span-4' disabled={isEdit} {...field} />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='realName'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>真实姓名 *</FormLabel>
                    <FormControl>
                      <Input placeholder='张三' className='col-span-4' autoComplete='off' {...field} />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>邮箱 *</FormLabel>
                    <FormControl>
                      <Input placeholder='请输入邮箱地址' className='col-span-4' {...field} />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='phone'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>手机号</FormLabel>
                    <FormControl>
                      <Input placeholder='13800138000' className='col-span-4' {...field} />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='departmentId'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>部门 *</FormLabel>
                    <DepartmentTreeSelect
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder='选择部门'
                      className='col-span-4'
                    />
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='roleIds'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>角色 *</FormLabel>
                    <TreeSelect
                      data={roleOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder='选择角色'
                      className='col-span-4'
                      multiple
                    />
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='status'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>状态</FormLabel>
                    <div className='col-span-4 flex items-center space-x-2'>
                      <FormControl>
                        <Switch
                          checked={field.value === 'active'}
                          onCheckedChange={(checked) => field.onChange(checked ? 'active' : 'inactive')}
                        />
                      </FormControl>
                      <span className='text-sm text-muted-foreground'>{field.value === 'active' ? '启用' : '禁用'}</span>
                    </div>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='password'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>密码 {!isEdit && '*'}</FormLabel>
                    <FormControl>
                      <PasswordInput placeholder={isEdit ? '留空则不修改' : '请输入密码'} className='col-span-4' {...field} />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='confirmPassword'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>确认密码</FormLabel>
                    <FormControl>
                      <PasswordInput disabled={!isPasswordTouched} placeholder='请再次输入密码' className='col-span-4' {...field} />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
        <DialogFooter>
          <Button type='submit' form='user-form' disabled={isPending}>
            {isPending ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
