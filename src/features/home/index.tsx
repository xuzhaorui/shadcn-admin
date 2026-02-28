import { useMemo, type ElementType } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Home, UserRound } from 'lucide-react'
import { menuApi } from '@/features/system/menus/api/menu-api'
import { buildNavGroupsFromMenus } from '@/components/layout/data/dynamic-system-nav'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { canAccessMenuCode, getPermissionsFromUser } from '@/lib/permission'
import { useAuthStore } from '@/stores/auth-store'
import { type Menu as SystemMenu } from '@/features/system/menus/data/schema'

type QuickLink = {
  title: string
  to: string
  icon?: ElementType
}

function collectQuickLinks(links: QuickLink[]): QuickLink[] {
  const dedup = new Map<string, QuickLink>()
  for (const link of links) {
    if (!link.to || link.to === '/') continue
    if (!dedup.has(link.to)) dedup.set(link.to, link)
  }
  return Array.from(dedup.values())
}

function collectPermissionMenuNames(
  menus: SystemMenu[],
  permissions: string[],
  names: Set<string>
) {
  for (const menu of menus) {
    if (menu.visible === false) continue
    if (menu.type !== 'button' && canAccessMenuCode(menu.code, permissions) && menu.name) {
      names.add(menu.name)
    }
    if (menu.children?.length) {
      collectPermissionMenuNames(menu.children, permissions, names)
    }
  }
}

export function HomePage() {
  const authUser = useAuthStore((state) => state.auth.user)
  const permissions = getPermissionsFromUser(authUser)
  const roleNames = authUser?.role ?? []

  const { data: menuTree, isLoading } = useQuery({
    queryKey: ['menus'],
    queryFn: () => menuApi.getMenuList(),
    staleTime: 1000 * 60 * 5,
  })

  const quickLinks = useMemo(() => {
    if (!menuTree?.length) return []

    const groups = buildNavGroupsFromMenus(menuTree, permissions)
    const links: QuickLink[] = []
    for (const group of groups) {
      for (const item of group.items) {
        if ('url' in item) {
          links.push({
            title: item.title,
            to: String(item.url),
            icon: item.icon,
          })
          continue
        }

        for (const child of item.items) {
          links.push({
            title: child.title,
            to: String(child.url),
            icon: child.icon ?? item.icon,
          })
        }
      }
    }
    return collectQuickLinks(links)
  }, [menuTree, permissions])

  const permissionMenuNames = useMemo(() => {
    if (!menuTree?.length) return []
    const names = new Set<string>()
    collectPermissionMenuNames(menuTree, permissions, names)
    return Array.from(names)
  }, [menuTree, permissions])

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

      <Main className='flex flex-1 flex-col gap-6'>
        <section className='rounded-2xl border bg-card p-6 sm:p-8'>
          <div className='flex items-start gap-4'>
            <div className='rounded-xl bg-primary/10 p-3 text-primary'>
              <Home className='h-6 w-6' />
            </div>
            <div className='space-y-1'>
              <h1 className='text-2xl font-semibold tracking-tight'>首页</h1>
              <p className='text-sm text-muted-foreground'>
                登录后统一先进入首页，避免因路径不匹配导致权限提示。
              </p>
            </div>
          </div>
        </section>

        <section className='grid gap-4 lg:grid-cols-2'>
          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='flex items-center gap-2 text-base'>
                <UserRound className='h-4 w-4 text-primary' />
                当前用户
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='text-sm'>
                <span className='text-muted-foreground'>账号：</span>
                <span>{authUser?.email || authUser?.accountNo || '-'}</span>
              </div>

              <div className='space-y-2'>
                <p className='text-sm text-muted-foreground'>您的角色</p>
                <div className='flex flex-wrap gap-2'>
                  {(roleNames.length ? roleNames : ['未分配角色']).map((roleName) => (
                    <Badge key={roleName} variant='default' className='font-normal'>
                      {roleName}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className='space-y-2'>
                <p className='text-sm text-muted-foreground'>您所拥有的权限（菜单名称）</p>
                <div className='max-h-32 overflow-y-auto'>
                  <div className='flex flex-wrap gap-2'>
                    {(permissionMenuNames.length ? permissionMenuNames : ['暂无菜单权限']).map((name) => (
                      <Badge key={name} variant='secondary' className='font-normal'>
                        {name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-base'>快速定位</CardTitle>
            </CardHeader>
            <CardContent className='max-h-[420px] overflow-y-auto pr-1'>
              {isLoading ? (
                <p className='text-sm text-muted-foreground'>加载可访问模块中...</p>
              ) : quickLinks.length ? (
                <div className='grid gap-3 sm:grid-cols-2'>
                  {quickLinks.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to as never}
                      className='rounded-xl border p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm'
                    >
                      <div className='mb-1 flex items-center gap-2 text-sm font-medium'>
                        {item.icon ? <item.icon className='h-4 w-4 text-primary' /> : null}
                        {item.title}
                      </div>
                      <p className='text-xs text-muted-foreground'>进入 {item.title}</p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className='text-sm text-muted-foreground'>当前暂无可快速访问的模块。</p>
              )}
            </CardContent>
          </Card>
        </section>
      </Main>
    </>
  )
}
