import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocation, useNavigate } from '@tanstack/react-router'
import { Home, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { type Menu } from '@/features/system/menus/data/schema'
import { menuApi } from '@/features/system/menus/api/menu-api'

type RouteTab = {
  path: string
  title: string
  closable: boolean
}

type RouteTabsProps = {
  menus?: Menu[]
  inline?: boolean
}

let runtimeTabs: RouteTab[] = []

const HOME_TAB: RouteTab = { path: '/', title: '首页', closable: false }
const PATH_TITLE_MAP: Record<string, string> = {
  '/': '首页',
  '/home': '首页',
  '/users': '用户管理',
  '/tasks': '任务管理',
  '/apps': '应用管理',
  '/help-center': '帮助中心',
  '/chats': '聊天',
  '/system/users': '用户管理',
  '/system/roles': '角色管理',
  '/system/menus': '菜单管理',
  '/system/depts': '部门管理',
  '/monitor/server': '服务监控',
  '/monitor/online': '在线用户',
  '/monitor/jobs': '定时任务',
  '/monitor/cache': '缓存监控',
  '/monitor/cache-list': '缓存列表',
  '/settings': '设置',
  '/settings/account': '账户设置',
  '/settings/appearance': '外观设置',
  '/settings/display': '显示设置',
  '/settings/notifications': '通知设置',
  '/components/tree': '树组件演示',
  '/logs': '操作日志',
}

const SEGMENT_TITLE_MAP: Record<string, string> = {
  system: '系统管理',
  users: '用户管理',
  roles: '角色管理',
  menus: '菜单管理',
  depts: '部门管理',
  monitor: '系统监控',
  server: '服务监控',
  online: '在线用户',
  jobs: '定时任务',
  cache: '缓存监控',
  'cache-list': '缓存列表',
  settings: '设置',
  account: '账户设置',
  appearance: '外观设置',
  display: '显示设置',
  notifications: '通知设置',
  apps: '应用管理',
  tasks: '任务管理',
  chats: '聊天',
  'help-center': '帮助中心',
  operation: '操作日志',
  logs: '操作日志',
  tree: '树组件演示',
}

function normalizePath(path: string): string {
  if (!path) return '/'
  const base = path.split('?')[0]
  if (!base || base === '/') return '/'
  return base.endsWith('/') ? base.slice(0, -1) || '/' : base
}

function flattenPathTitleMap(menus: Menu[]): Record<string, string> {
  const map: Record<string, string> = {}
  const walk = (items: Menu[]) => {
    for (const item of items) {
      if (item.path && item.type !== 'button' && item.visible !== false) {
        map[item.path] = item.name
      }
      if (item.children?.length) {
        walk(item.children)
      }
    }
  }
  walk(menus)
  return map
}

function guessTitleFromPath(path: string): string {
  if (path === '/') return HOME_TAB.title
  const segments = path.split('/').filter(Boolean)
  const tail = segments[segments.length - 1]
  return SEGMENT_TITLE_MAP[tail] || tail.replace(/[-_]/g, ' ')
}

function dedupeTabs(tabs: RouteTab[]): RouteTab[] {
  const seen = new Set<string>()
  return tabs
    .map((tab) => {
      const normalizedPath = normalizePath(tab.path)
      return {
        path: normalizedPath,
        title: tab.title,
        closable: normalizedPath !== '/' && tab.closable !== false,
      }
    })
    .filter((tab) => {
      if (seen.has(tab.path)) return false
      seen.add(tab.path)
      return true
    })
}

function resolveRouteTitle(path: string, titleMap: Record<string, string>): string {
  const normalizedPath = normalizePath(path)
  return titleMap[normalizedPath] || PATH_TITLE_MAP[normalizedPath] || guessTitleFromPath(normalizedPath)
}

export function RouteTabs({ menus = [], inline = false }: RouteTabsProps) {
  const navigate = useNavigate()
  const pathname = normalizePath(useLocation({ select: (location) => location.pathname }))

  const { data: menuTree = [] } = useQuery({
    queryKey: ['menus'],
    queryFn: () => menuApi.getMenuList(),
    staleTime: 1000 * 60 * 5,
    enabled: menus.length === 0,
  })

  const effectiveMenus = menus.length > 0 ? menus : menuTree
  const titleMap = useMemo(() => flattenPathTitleMap(effectiveMenus), [effectiveMenus])

  const [manualTabs, setManualTabs] = useState<RouteTab[]>(() => {
    const initialTabs =
      runtimeTabs.length > 0
        ? dedupeTabs(
            runtimeTabs.map((tab) => {
              const path = normalizePath(tab.path)
              return {
                ...tab,
                path,
                title: resolveRouteTitle(path, titleMap),
                closable: path !== '/' && tab.closable !== false,
              }
            })
          )
        : []

    if (initialTabs.some((tab) => tab.path === pathname)) return initialTabs

    return [
      ...initialTabs,
      {
        path: pathname,
        title: resolveRouteTitle(pathname, titleMap),
        closable: pathname !== '/',
      },
    ]
  })

  const tabs = useMemo(() => {
    const normalized = dedupeTabs(
      manualTabs.map((tab) => {
        const path = normalizePath(tab.path)
        return {
          ...tab,
          path,
          title: resolveRouteTitle(path, titleMap),
          closable: path !== '/' && tab.closable !== false,
        }
      })
    )

    if (normalized.some((tab) => tab.path === pathname)) return normalized

    return [
      ...normalized,
      {
        path: pathname,
        title: resolveRouteTitle(pathname, titleMap),
        closable: pathname !== '/',
      },
    ]
  }, [manualTabs, pathname, titleMap])

  useEffect(() => {
    runtimeTabs = tabs
  }, [tabs])

  const closeTab = (path: string) => {
    const targetPath = normalizePath(path)
    if (targetPath === '/') return

    const idx = tabs.findIndex((tab) => normalizePath(tab.path) === targetPath)
    if (idx < 0) return

    const nextTabs = tabs.filter((tab) => normalizePath(tab.path) !== targetPath)

    if (pathname === targetPath) {
      const fallback = nextTabs[idx - 1] || nextTabs[idx] || HOME_TAB
      navigate({ to: fallback.path })
    }

    setManualTabs(nextTabs.length > 0 ? nextTabs : [HOME_TAB])
  }

  return (
    <div
      className={cn(
        inline
          ? 'min-w-0 flex-1'
          : 'border-b bg-background/95 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/70'
      )}
    >
      <div className={cn('flex gap-2 overflow-x-auto', inline && 'py-0')}>
        {tabs.map((tab) => {
          const active = tab.path === pathname
          return (
            <div
              key={tab.path}
              className={cn(
                'group inline-flex h-8 shrink-0 items-center rounded-md border px-2 text-sm transition-colors',
                active
                  ? 'border-black bg-black text-white'
                  : 'border-border bg-muted/40 text-muted-foreground hover:text-foreground'
              )}
            >
              <button
                type='button'
                className='inline-flex items-center gap-1.5'
                onClick={() => navigate({ to: tab.path })}
              >
                {tab.path === '/' ? <Home className='h-3.5 w-3.5' /> : null}
                <span className='max-w-36 truncate'>{tab.title}</span>
              </button>
              {tab.closable ? (
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  className={cn(
                    'ml-1 h-5 w-5',
                    active ? 'text-white hover:bg-white/20 hover:text-white' : 'opacity-70 hover:opacity-100'
                  )}
                  onClick={(e) => {
                    e.stopPropagation()
                    closeTab(tab.path)
                  }}
                  aria-label={`关闭${tab.title}`}
                >
                  <X className='h-3 w-3' />
                </Button>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
