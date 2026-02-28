import { useNavigate, useSearch } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { usePermission } from '@/hooks/use-permission'
import { type NavigateFn } from '@/hooks/use-table-url-state'
import { RolesDialogs } from './components/roles-dialogs'
import { RolesPrimaryButtons } from './components/roles-primary-buttons'
import { RolesProvider } from './components/roles-provider'
import { RolesTable } from './components/roles-table'
import { roleApi } from './api/role-api'
import { useRoleList } from './hooks/useRoleList'
import { useBatchDeleteRoles } from './hooks/useRoleMutations'
import { useRoleExport } from './hooks/useRoleExport'

export function Roles() {
  const search = useSearch({ strict: false })
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { can } = usePermission()
  const page = typeof search.page === 'number' ? search.page : 1
  const pageSize = typeof search.pageSize === 'number' ? search.pageSize : 10
  const keyword = typeof search.keyword === 'string' ? search.keyword : ''
  const rawStatus = Array.isArray(search.status) && search.status.length > 0 ? search.status[0] : undefined
  const status = rawStatus === 'active' || rawStatus === 'inactive' ? rawStatus : undefined
  const canEdit = can('system:roles:edit')
  const canDelete = can('system:roles:delete')

  const { data, isLoading, refetch } = useRoleList({
    page,
    pageSize,
    keyword: keyword || undefined,
    status,
  })

  const batchDeleteMutation = useBatchDeleteRoles()
  const { exportRoles, isExporting } = useRoleExport()

  const handleBatchDelete = async (selectedIds: string[]) => {
    await batchDeleteMutation.mutateAsync({ ids: selectedIds })
  }

  const handleBatchStatusChange = async (
    selectedIds: string[],
    status: 'active' | 'inactive'
  ) => {
    await Promise.all(selectedIds.map((id) => roleApi.toggleRoleStatus(id, { status })))
    await queryClient.invalidateQueries({ queryKey: ['roles', 'list'] })
    toast.success(`已${status === 'active' ? '启用' : '停用'} ${selectedIds.length} 项角色`)
  }

  const handleExport = () => {
    exportRoles({
      page,
      pageSize,
      keyword: keyword || undefined,
      status,
    })
  }

  const handleRefresh = () => {
    refetch()
  }

  return (
    <RolesProvider>
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
            <h2 className='text-2xl font-bold tracking-tight'>角色管理</h2>
            <p className='text-muted-foreground'>管理系统角色和权限配置</p>
          </div>
          <RolesPrimaryButtons
            selectedCount={0}
            onExport={handleExport}
            onRefresh={handleRefresh}
            isExporting={isExporting}
          />
        </div>

        {isLoading ? (
          <div className='flex items-center justify-center h-64'>
            <p className='text-muted-foreground'>加载中...</p>
          </div>
        ) : (
          <RolesTable
            data={data?.list || []}
            total={data?.total || 0}
            loading={isLoading}
            search={search as Record<string, unknown>}
            navigate={navigate as unknown as NavigateFn}
            onBatchEnable={canEdit ? (ids) => handleBatchStatusChange(ids, 'active') : undefined}
            onBatchDisable={canEdit ? (ids) => handleBatchStatusChange(ids, 'inactive') : undefined}
            onBatchDelete={canDelete ? handleBatchDelete : undefined}
          />
        )}
        <RolesDialogs />
      </Main>
    </RolesProvider>
  )
}
