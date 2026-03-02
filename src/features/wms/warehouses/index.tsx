import { useMemo, useState } from 'react'
import { Pencil, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { usePermission } from '@/hooks/use-permission'
import { type Warehouse, type WarehouseFormData } from './data/schema'
import {
  useCreateWarehouse,
  useUpdateWarehouse,
  useWarehouses,
} from './hooks/use-warehouses'

type WarehouseFormState = {
  name: string
  description: string
  status: 'active' | 'inactive'
}

const defaultFormState = (): WarehouseFormState => ({
  name: '',
  description: '',
  status: 'active',
})

const formFromWarehouse = (warehouse: Warehouse): WarehouseFormState => ({
  name: warehouse.name,
  description: warehouse.description ?? '',
  status: warehouse.status,
})

export function Warehouses() {
  const { can } = usePermission()
  const canCreate = can('wms:warehouses:create')
  const canEdit = can('wms:warehouses:edit')

  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null)
  const [form, setForm] = useState<WarehouseFormState>(defaultFormState)
  const pageSize = 20

  const queryParams = useMemo(
    () => ({
      page,
      pageSize,
      keyword: keyword.trim() || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
    }),
    [keyword, page, statusFilter]
  )

  const { data, isLoading, isFetching } = useWarehouses(queryParams)
  const createMutation = useCreateWarehouse()
  const updateMutation = useUpdateWarehouse()

  const warehouses = data?.list || []
  const total = data?.total || 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const isPageLoading = isLoading || isFetching
  const isMutating = createMutation.isPending || updateMutation.isPending

  const activeCount = warehouses.filter((item) => item.status === 'active').length
  const inactiveCount = warehouses.filter((item) => item.status === 'inactive').length

  const openCreate = () => {
    if (!canCreate) return
    setEditingWarehouse(null)
    setForm(defaultFormState())
    setFormOpen(true)
  }

  const openEdit = (warehouse: Warehouse) => {
    if (!canEdit) return
    setEditingWarehouse(warehouse)
    setForm(formFromWarehouse(warehouse))
    setFormOpen(true)
  }

  const handleSubmit = async () => {
    const name = form.name.trim()
    if (!name) {
      toast.error('仓库名称不能为空')
      return
    }

    const payload: WarehouseFormData = {
      name,
      description: form.description.trim() || undefined,
      status: form.status,
    }

    if (editingWarehouse) {
      if (!canEdit) return
      await updateMutation.mutateAsync({ id: editingWarehouse.id, payload })
      toast.success(`仓库“${payload.name}”已更新`)
    } else {
      if (!canCreate) return
      await createMutation.mutateAsync(payload)
      toast.success(`仓库“${payload.name}”已创建`)
    }

    setFormOpen(false)
  }

  return (
    <>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>仓库管理</h2>
            <p className='text-muted-foreground'>维护仓库基础信息并管理启用状态。</p>
          </div>
          <div className='flex items-center gap-2'>
            <Badge variant='secondary'>启用：{activeCount}</Badge>
            <Badge variant='outline'>停用：{inactiveCount}</Badge>
            {canCreate ? (
              <Button onClick={openCreate} disabled={isMutating}>
                <Plus className='h-4 w-4' />
                新建仓库
              </Button>
            ) : null}
          </div>
        </div>

        <div className='flex flex-wrap gap-2'>
          <Input
            className='w-56'
            placeholder='搜索仓库名称/描述'
            value={keyword}
            onChange={(e) => {
              setPage(1)
              setKeyword(e.target.value)
            }}
          />
          <Select
            value={statusFilter}
            onValueChange={(value: 'all' | 'active' | 'inactive') => {
              setPage(1)
              setStatusFilter(value)
            }}
          >
            <SelectTrigger className='w-36'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>全部状态</SelectItem>
              <SelectItem value='active'>启用</SelectItem>
              <SelectItem value='inactive'>停用</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className='overflow-hidden rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>仓库名称</TableHead>
                <TableHead>仓库描述</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead>更新时间</TableHead>
                <TableHead className='w-[120px]'>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPageLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className='h-24 text-center text-muted-foreground'>
                    加载仓库数据中...
                  </TableCell>
                </TableRow>
              ) : warehouses.length > 0 ? (
                warehouses.map((warehouse) => (
                  <TableRow key={warehouse.id}>
                    <TableCell className='font-medium'>{warehouse.name}</TableCell>
                    <TableCell className='text-muted-foreground'>
                      {warehouse.description || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={warehouse.status === 'active' ? 'default' : 'secondary'}>
                        {warehouse.status === 'active' ? '启用' : '停用'}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-sm text-muted-foreground'>
                      {warehouse.createdAt?.toLocaleString('zh-CN') || '-'}
                    </TableCell>
                    <TableCell className='text-sm text-muted-foreground'>
                      {warehouse.updatedAt?.toLocaleString('zh-CN') || '-'}
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        {canEdit ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant='ghost'
                                size='icon'
                                className='h-8 w-8'
                                onClick={() => openEdit(warehouse)}
                                disabled={isMutating}
                              >
                                <Pencil className='h-4 w-4' />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>编辑</TooltipContent>
                          </Tooltip>
                        ) : null}
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className='h-24 text-center'>
                    暂无仓库数据
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className='flex items-center justify-between text-sm text-muted-foreground'>
          <span>
            共 {total} 条，当前第 {page}/{totalPages} 页
          </span>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page <= 1 || isPageLoading}
            >
              上一页
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page >= totalPages || isPageLoading}
            >
              下一页
            </Button>
          </div>
        </div>
      </Main>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className='max-w-lg'>
          <DialogHeader>
            <DialogTitle>{editingWarehouse ? '编辑仓库' : '新建仓库'}</DialogTitle>
            <DialogDescription>
              {editingWarehouse ? '更新仓库信息。' : '填写仓库信息并保存。'}
            </DialogDescription>
          </DialogHeader>

          <div className='grid gap-4 py-2'>
            <div className='grid gap-2'>
              <Label htmlFor='warehouse-name'>仓库名称</Label>
              <Input
                id='warehouse-name'
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='warehouse-description'>仓库描述</Label>
              <Textarea
                id='warehouse-description'
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='warehouse-status'>仓库状态</Label>
              <Select
                value={form.status}
                onValueChange={(value: 'active' | 'inactive') =>
                  setForm((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger id='warehouse-status' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='active'>启用</SelectItem>
                  <SelectItem value='inactive'>停用</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setFormOpen(false)}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              取消
            </Button>
            <Button
              onClick={() => void handleSubmit()}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
