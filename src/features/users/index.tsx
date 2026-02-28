import { useNavigate, useSearch } from '@tanstack/react-router'
import { type NavigateFn } from '@/hooks/use-table-url-state'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { UsersDialogs } from './components/users-dialogs'
import { UsersPrimaryButtons } from './components/users-primary-buttons'
import { UsersProvider } from './components/users-provider'
import { UsersTable } from './components/users-table'
import { useExportUsersMutation, useUserListQuery } from './hooks/use-user-list'

export function Users() {
  const search = useSearch({ strict: false })
  const navigate = useNavigate()

  const page = typeof search.page === 'number' ? search.page : 1
  const pageSize = typeof search.pageSize === 'number' ? search.pageSize : 10
  const username = typeof search.username === 'string' ? search.username : ''
  const rawStatus = Array.isArray(search.status) && search.status.length > 0 ? search.status[0] : undefined
  const status = rawStatus === 'active' || rawStatus === 'inactive' ? rawStatus : undefined
  const role = Array.isArray(search.role) ? search.role : []

  const { data, isLoading, refetch } = useUserListQuery({
    page,
    pageSize,
    keyword: username || undefined,
    status,
    roleIds: role.length > 0 ? role : undefined,
  })

  const exportMutation = useExportUsersMutation()

  return (
    <UsersProvider>
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
            <h2 className='text-2xl font-bold tracking-tight'>用户列表</h2>
            <p className='text-muted-foreground'>在这里管理用户及其角色</p>
          </div>
          <UsersPrimaryButtons
            onRefresh={() => refetch()}
            onExport={() =>
              exportMutation.mutate({
                page,
                pageSize,
                keyword: username || undefined,
                status,
                roleIds: role.length > 0 ? role : undefined,
              })
            }
            isExporting={exportMutation.isPending}
          />
        </div>
        <UsersTable
          data={data?.list || []}
          total={data?.total || 0}
          search={search as Record<string, unknown>}
          navigate={navigate as unknown as NavigateFn}
          loading={isLoading}
        />
      </Main>

      <UsersDialogs />
    </UsersProvider>
  )
}
