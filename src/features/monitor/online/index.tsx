import { useMemo, useState } from 'react'
import { LogOut, Search as SearchIcon } from 'lucide-react'
import { toast } from 'sonner'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { usePermission } from '@/hooks/use-permission'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { type OnlineUser } from './data/schema'
import { useForceLogout, useOnlineUsers } from './hooks/use-online-users'

function parseSearchToQuery(value: string): { username?: string; ip?: string } {
  const keyword = value.trim()
  if (!keyword) return {}
  const maybeIp = /^[0-9a-fA-F:.]+$/.test(keyword)
  return maybeIp ? { ip: keyword } : { username: keyword }
}

export function OnlineUsers() {
  const { can } = usePermission()
  const canForceLogout = can('monitor:online:force-logout')
  const [searchText, setSearchText] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 20
  const [userToLogout, setUserToLogout] = useState<OnlineUser | null>(null)

  const queryParams = useMemo(() => {
    const searchQuery = parseSearchToQuery(searchText)
    return {
      page,
      pageSize,
      ...searchQuery,
    }
  }, [page, searchText])

  const { data, isLoading, isFetching } = useOnlineUsers(queryParams)
  const forceLogoutMutation = useForceLogout()

  const users = data?.list || []
  const total = data?.total || 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const isPageLoading = isLoading || isFetching

  const handleForceLogout = async () => {
    if (!canForceLogout) return
    if (!userToLogout) return
    await forceLogoutMutation.mutateAsync(userToLogout.id)
    toast.success(`用户 "${userToLogout.username}" 已被强制下线`)
    setUserToLogout(null)
  }

  const handleSearchChange = (value: string) => {
    setSearchText(value)
    setPage(1)
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
            <h2 className='text-2xl font-bold tracking-tight'>在线用户</h2>
            <p className='text-muted-foreground'>查看当前在线用户并管理会话</p>
          </div>
          <Badge variant='secondary' className='text-base'>
            共 {total} 人在线
          </Badge>
        </div>

        <div className='flex gap-4'>
          <div className='relative max-w-xs flex-1'>
            <SearchIcon className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              placeholder='搜索用户名或 IP 地址...'
              value={searchText}
              onChange={(e) => handleSearchChange(e.target.value)}
              className='pl-9'
            />
          </div>
        </div>

        <div className='overflow-hidden rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>会话ID</TableHead>
                <TableHead>用户名</TableHead>
                <TableHead>部门</TableHead>
                <TableHead>IP 地址</TableHead>
                <TableHead>地理位置</TableHead>
                <TableHead>浏览器</TableHead>
                <TableHead>操作系统</TableHead>
                <TableHead>登录时间</TableHead>
                <TableHead className='w-[100px]'>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPageLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className='h-24 text-center text-muted-foreground'>
                    加载中...
                  </TableCell>
                </TableRow>
              ) : users.length > 0 ? (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className='font-mono text-xs'>{user.id.slice(0, 8)}...</TableCell>
                    <TableCell className='font-medium'>{user.username}</TableCell>
                    <TableCell>{user.deptName}</TableCell>
                    <TableCell className='font-mono text-xs'>{user.ip}</TableCell>
                    <TableCell>{user.location}</TableCell>
                    <TableCell>{user.browser}</TableCell>
                    <TableCell>{user.os}</TableCell>
                    <TableCell className='text-muted-foreground text-sm'>
                      {new Date(user.loginTime).toLocaleString('zh-CN')}
                    </TableCell>
                    <TableCell>
                      {canForceLogout ? (
                        <Button
                          variant='ghost'
                          size='sm'
                          className='text-destructive hover:text-destructive'
                          onClick={() => setUserToLogout(user)}
                        >
                          <LogOut className='mr-1 h-4 w-4' />
                          强制下线
                        </Button>
                      ) : (
                        <span className='text-xs text-muted-foreground'>-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className='h-24 text-center'>
                    暂无在线用户
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className='flex items-center justify-between text-sm text-muted-foreground'>
          <span>
            共 {total} 条，当前第 {page} / {totalPages} 页
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

      <AlertDialog open={!!userToLogout && canForceLogout} onOpenChange={(v) => !v && setUserToLogout(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认强制下线</AlertDialogTitle>
            <AlertDialogDescription>
              确定要强制用户 <span className='font-medium'>"{userToLogout?.username}"</span> 下线吗？
              该用户的当前会话将被终止。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleForceLogout()}
              disabled={forceLogoutMutation.isPending}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              确认下线
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
