import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Home } from 'lucide-react'
import { menuApi } from '@/features/system/menus/api/menu-api'
import { getPermissionsFromUser } from '@/lib/permission'
import { useLayout } from '@/context/layout-provider'
import { useAuthStore } from '@/stores/auth-store'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { sidebarData } from './data/sidebar-data'
import { buildNavGroupsFromMenus } from './data/dynamic-system-nav'
import { NavGroup } from './nav-group'
import { NavUser } from './nav-user'
import { TeamSwitcher } from './team-switcher'
import { type NavGroup as SidebarNavGroup, type NavItem } from './types'

function shouldHideDictMenu(menu: { code?: string; path?: string; name?: string }): boolean {
  const code = String(menu.code || '').toLowerCase()
  const path = String(menu.path || '').toLowerCase()
  const name = String(menu.name || '')

  return (
    code.includes('dict') ||
    code.includes('dictionary') ||
    path.includes('/system/dict') ||
    path.includes('/dict') ||
    name.includes('字典')
  )
}

function stripDictMenus<T extends { code?: string; path?: string; name?: string; children?: T[] }>(menus: T[]): T[] {
  return menus
    .filter((menu) => !shouldHideDictMenu(menu))
    .map((menu) => ({
      ...menu,
      children: menu.children ? stripDictMenus(menu.children) : menu.children,
    }))
}

function normalizeHomeItem(item: NavItem): NavItem {
  if ('url' in item && String(item.url) === '/') {
    return { ...item, title: '首页', icon: item.icon ?? Home }
  }
  return item
}

function ensureHomeEntry(groups: SidebarNavGroup[]): SidebarNavGroup[] {
  const normalized = groups.map((group) => ({
    ...group,
    items: group.items.map(normalizeHomeItem),
  }))

  const hasHome = normalized.some((group) =>
    group.items.some((item) => 'url' in item && String(item.url) === '/')
  )

  if (hasHome) return normalized

  const homeItem: NavItem = { title: '首页', url: '/', icon: Home }
  if (normalized.length === 0) {
    return [{ title: '通用', items: [homeItem] }]
  }

  const [first, ...rest] = normalized
  return [{ ...first, items: [homeItem, ...first.items] }, ...rest]
}

export function AppSidebar() {
  const { collapsible, variant } = useLayout()
  const authUser = useAuthStore((state) => state.auth.user)
  const permissions = useMemo(() => getPermissionsFromUser(authUser), [authUser])

  const { data: menuTree } = useQuery({
    queryKey: ['menus'],
    queryFn: () => menuApi.getMenuList(),
    staleTime: 1000 * 60 * 5,
  })

  const navGroups = useMemo(() => {
    if (menuTree?.length) {
      const filteredMenuTree = stripDictMenus(menuTree)
      return ensureHomeEntry(buildNavGroupsFromMenus(filteredMenuTree, permissions))
    }
    return []
  }, [menuTree, permissions])

  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader>
        <TeamSwitcher teams={sidebarData.teams} />
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sidebarData.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
