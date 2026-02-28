import { useMemo, useState } from 'react'
import { Clock, Pause, Pencil, Play, Plus, RotateCw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
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
import { Switch } from '@/components/ui/switch'
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
import type { Job, JobInvokeTarget, MisfirePolicy } from './data/schema'
import {
  useCreateJob,
  useDeleteJob,
  useExecuteJob,
  useJobs,
  useToggleJobStatus,
  useUpdateJob,
} from './hooks/use-jobs'

type JobFormState = {
  name: string
  group: string
  invokeTarget: JobInvokeTarget
  cronExpression: string
  misfirePolicy: MisfirePolicy
  concurrent: boolean
  status: 'running' | 'paused'
  remark: string
}

const INVOKE_TARGET_OPTIONS: Array<{ value: JobInvokeTarget; label: string }> = [
  { value: 'LOG_CLEANUP', label: '日志清理' },
  { value: 'DATA_BACKUP', label: '数据备份' },
]

const invokeTargetLabel = (value: JobInvokeTarget) =>
  INVOKE_TARGET_OPTIONS.find((option) => option.value === value)?.label ?? value

const defaultFormState = (): JobFormState => ({
  name: '',
  group: 'DEFAULT',
  invokeTarget: 'LOG_CLEANUP',
  cronExpression: '0 0/30 * * * ?',
  misfirePolicy: 'default',
  concurrent: true,
  status: 'running',
  remark: '',
})

const formFromJob = (job: Job): JobFormState => ({
  name: job.name,
  group: job.group,
  invokeTarget: job.invokeTarget,
  cronExpression: job.cronExpression,
  misfirePolicy: job.misfirePolicy,
  concurrent: job.concurrent,
  status: job.status,
  remark: job.remark ?? '',
})

export function Jobs() {
  const { can } = usePermission()
  const canCreate = can('monitor:jobs:create')
  const canEdit = can('monitor:jobs:edit')
  const canDelete = can('monitor:jobs:delete')
  const canRun = can('monitor:jobs:run')

  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [form, setForm] = useState<JobFormState>(defaultFormState)
  const [deletingJob, setDeletingJob] = useState<Job | null>(null)
  const pageSize = 20

  const queryParams = useMemo(() => ({ page, pageSize }), [page])

  const { data, isLoading, isFetching } = useJobs(queryParams)
  const createMutation = useCreateJob()
  const updateMutation = useUpdateJob()
  const deleteMutation = useDeleteJob()
  const toggleMutation = useToggleJobStatus()
  const executeMutation = useExecuteJob()

  const jobs = data?.list || []
  const total = data?.total || 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const isPageLoading = isLoading || isFetching

  const runningCount = jobs.filter((job) => job.status === 'running').length
  const pausedCount = jobs.filter((job) => job.status === 'paused').length

  const isMutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    toggleMutation.isPending ||
    executeMutation.isPending

  const openCreate = () => {
    if (!canCreate) return
    setEditingJob(null)
    setForm(defaultFormState())
    setFormOpen(true)
  }

  const openEdit = (job: Job) => {
    if (!canEdit) return
    setEditingJob(job)
    setForm(formFromJob(job))
    setFormOpen(true)
  }

  const validateForm = () => {
    if (!form.name.trim()) return '任务名称不能为空'
    if (!form.group.trim()) return '任务分组不能为空'
    if (!form.cronExpression.trim()) return 'Cron 表达式不能为空'
    return null
  }

  const handleSubmit = async () => {
    if (editingJob && !canEdit) return
    if (!editingJob && !canCreate) return

    const validationError = validateForm()
    if (validationError) {
      toast.error(validationError)
      return
    }

    const payload = {
      name: form.name.trim(),
      group: form.group.trim(),
      invokeTarget: form.invokeTarget,
      cronExpression: form.cronExpression.trim(),
      misfirePolicy: form.misfirePolicy,
      concurrent: form.concurrent,
      status: form.status,
      remark: form.remark.trim() || undefined,
    }

    if (editingJob) {
      await updateMutation.mutateAsync({ id: editingJob.id, payload })
      toast.success(`任务“${payload.name}”已更新`)
    } else {
      await createMutation.mutateAsync(payload)
      toast.success(`任务“${payload.name}”已创建`)
    }

    setFormOpen(false)
  }

  const handleToggleStatus = async (
    id: string,
    name: string,
    currentStatus: 'running' | 'paused'
  ) => {
    if (!canEdit) return
    const nextStatus = currentStatus === 'running' ? 'paused' : 'running'
    await toggleMutation.mutateAsync({ id, status: nextStatus })
    toast.success(`任务“${name}”状态已切换为${nextStatus === 'running' ? '运行中' : '已暂停'}`)
  }

  const handleExecute = async (id: string, name: string) => {
    if (!canRun) return
    await executeMutation.mutateAsync(id)
    toast.success(`任务“${name}”已执行`)
  }

  const handleDelete = async () => {
    if (!canDelete || !deletingJob) return
    await deleteMutation.mutateAsync(deletingJob.id)
    toast.success(`任务“${deletingJob.name}”已删除`)
    setDeletingJob(null)
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
            <h2 className='text-2xl font-bold tracking-tight'>定时任务</h2>
            <p className='text-muted-foreground'>管理并执行系统 Quartz 定时任务。</p>
          </div>
          <div className='flex items-center gap-2'>
            <Badge variant='secondary' className='gap-1'>
              <Clock className='h-3 w-3' />
              运行中：{runningCount}
            </Badge>
            <Badge variant='outline'>已暂停：{pausedCount}</Badge>
            {canCreate ? (
              <Button onClick={openCreate} disabled={isMutating}>
                <Plus className='h-4 w-4' />
                新建任务
              </Button>
            ) : null}
          </div>
        </div>

        <div className='overflow-hidden rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>任务名称</TableHead>
                <TableHead>分组</TableHead>
                <TableHead>调用目标</TableHead>
                <TableHead>Cron</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead>下次执行</TableHead>
                <TableHead className='w-[200px]'>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPageLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className='h-24 text-center text-muted-foreground'>
                    加载任务中...
                  </TableCell>
                </TableRow>
              ) : jobs.length > 0 ? (
                jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className='font-medium'>{job.name}</TableCell>
                    <TableCell>
                      <Badge variant='outline'>{job.group}</Badge>
                    </TableCell>
                    <TableCell>
                      <code className='bg-muted rounded px-2 py-1 text-xs'>
                        {invokeTargetLabel(job.invokeTarget)}
                      </code>
                    </TableCell>
                    <TableCell>
                      <code className='bg-muted rounded px-2 py-1 text-xs'>{job.cronExpression}</code>
                    </TableCell>
                    <TableCell>
                      <Badge variant={job.status === 'running' ? 'default' : 'secondary'}>
                        {job.status === 'running' ? '运行中' : '已暂停'}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-sm text-muted-foreground'>
                      {job.createdAt?.toLocaleString('zh-CN') || '-'}
                    </TableCell>
                    <TableCell className='text-sm text-muted-foreground'>
                      {job.nextExecuteTime?.toLocaleString('zh-CN') || '-'}
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <div className='flex items-center gap-1'>
                          {canEdit ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant='ghost'
                                  size='icon'
                                  className='h-8 w-8'
                                  onClick={() => void handleToggleStatus(job.id, job.name, job.status)}
                                  disabled={isMutating}
                                >
                                  {job.status === 'running' ? (
                                    <Pause className='h-4 w-4' />
                                  ) : (
                                    <Play className='h-4 w-4' />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {job.status === 'running' ? '暂停' : '恢复'}
                              </TooltipContent>
                            </Tooltip>
                          ) : null}

                          {canRun ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant='ghost'
                                  size='icon'
                                  className='h-8 w-8'
                                  onClick={() => void handleExecute(job.id, job.name)}
                                  disabled={isMutating}
                                >
                                  <RotateCw className='h-4 w-4' />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>立即执行</TooltipContent>
                            </Tooltip>
                          ) : null}

                          {canEdit ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant='ghost'
                                  size='icon'
                                  className='h-8 w-8'
                                  onClick={() => openEdit(job)}
                                  disabled={isMutating}
                                >
                                  <Pencil className='h-4 w-4' />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>编辑</TooltipContent>
                            </Tooltip>
                          ) : null}

                          {canDelete ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant='ghost'
                                  size='icon'
                                  className='h-8 w-8 text-destructive'
                                  onClick={() => setDeletingJob(job)}
                                  disabled={isMutating}
                                >
                                  <Trash2 className='h-4 w-4' />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>删除</TooltipContent>
                            </Tooltip>
                          ) : null}
                        </div>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className='h-24 text-center'>
                    暂无任务数据
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
        <DialogContent className='max-w-xl'>
          <DialogHeader>
            <DialogTitle>{editingJob ? '编辑任务' : '新建任务'}</DialogTitle>
            <DialogDescription>
              {editingJob ? '更新任务配置与执行策略。' : '创建一个新的定时任务。'}
            </DialogDescription>
          </DialogHeader>

          <div className='grid gap-4 py-2'>
            <div className='grid gap-2'>
              <Label htmlFor='job-name'>任务名称</Label>
              <Input
                id='job-name'
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div className='grid gap-2'>
                <Label htmlFor='job-group'>任务分组</Label>
                <Input
                  id='job-group'
                  value={form.group}
                  onChange={(e) => setForm((prev) => ({ ...prev, group: e.target.value }))}
                />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='job-status'>状态</Label>
                <Select
                  value={form.status}
                  onValueChange={(value: 'running' | 'paused') =>
                    setForm((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger id='job-status' className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='running'>运行中</SelectItem>
                    <SelectItem value='paused'>已暂停</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='job-target'>调用目标</Label>
              <Select
                value={form.invokeTarget}
                onValueChange={(value: JobInvokeTarget) =>
                  setForm((prev) => ({ ...prev, invokeTarget: value }))
                }
              >
                <SelectTrigger id='job-target' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INVOKE_TARGET_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div className='grid gap-2'>
                <Label htmlFor='job-cron'>Cron 表达式</Label>
                <Input
                  id='job-cron'
                  value={form.cronExpression}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, cronExpression: e.target.value }))
                  }
                />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='misfire-policy'>Misfire 策略</Label>
                <Select
                  value={form.misfirePolicy}
                  onValueChange={(value: MisfirePolicy) =>
                    setForm((prev) => ({ ...prev, misfirePolicy: value }))
                  }
                >
                  <SelectTrigger id='misfire-policy' className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='default'>default</SelectItem>
                    <SelectItem value='ignore'>ignore</SelectItem>
                    <SelectItem value='fireOnce'>fireOnce</SelectItem>
                    <SelectItem value='fireAll'>fireAll</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className='flex items-center justify-between rounded-md border p-3'>
              <Label htmlFor='concurrent'>允许并发执行</Label>
              <Switch
                id='concurrent'
                checked={form.concurrent}
                onCheckedChange={(checked) => setForm((prev) => ({ ...prev, concurrent: checked }))}
              />
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='job-remark'>备注</Label>
              <Textarea
                id='job-remark'
                value={form.remark}
                onChange={(e) => setForm((prev) => ({ ...prev, remark: e.target.value }))}
              />
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

      <ConfirmDialog
        open={!!deletingJob && canDelete}
        onOpenChange={(open) => !open && setDeletingJob(null)}
        title='确认删除该任务？'
        desc={deletingJob ? `任务“${deletingJob.name}”将被永久删除。` : ''}
        destructive
        isLoading={deleteMutation.isPending}
        handleConfirm={() => void handleDelete()}
        confirmText='删除'
        cancelBtnText='取消'
      />
    </>
  )
}
