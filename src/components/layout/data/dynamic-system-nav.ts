import {
  Activity,
  Bell,
  BookOpen,
  Bug,
  Building2,
  Clock,
  Database,
  FileText,
  HelpCircle,
  LayoutDashboard,
  List,
  ListTodo,
  Menu,
  MessagesSquare,
  Monitor,
  Package,
  Palette,
  Server,
  Settings,
  Shield,
  ShieldCheck,
  UserCog,
  Users,
  Wrench,
} from 'lucide-react'
import { type ElementType } from 'react'
import { canAccessMenuCode } from '@/lib/permission'
import { type Menu as SystemMenu } from '@/features/system/menus/data/schema'
import { type NavGroup, type NavItem } from '../types'

const iconMap: Record<string, ElementType> = {
  Activity,
  Bell,
  BookOpen,
  Bug,
  Building2,
  Clock,
  Database,
  FileText,
  HelpCircle,
  LayoutDashboard,
  List,
  ListTodo,
  Menu,
  MessagesSquare,
  Monitor,
  Package,
  Palette,
  Server,
  Settings,
  Shield,
  ShieldCheck,
  UserCog,
  Users,
  Wrench,
}

function sortMenusBySort(menus: SystemMenu[]): SystemMenu[] {
  return [...menus].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
}

function collectLeafLinks(
  menus: SystemMenu[],
  permissions: string[]
): Array<{ title: string; url: string; icon?: ElementType }> {
  const result: Array<{ title: string; url: string; icon?: ElementType }> = []

  for (const menu of sortMenusBySort(menus)) {
    if (menu.visible === false || menu.type === 'button') continue

    const icon = menu.icon ? iconMap[menu.icon] : undefined
    const canAccessSelf = canAccessMenuCode(menu.code, permissions)
    if (menu.path && canAccessSelf) {
      result.push({ title: menu.name, url: menu.path, icon })
      continue
    }

    if (menu.children?.length) {
      result.push(...collectLeafLinks(menu.children, permissions))
    }
  }

  return result
}

function toNavItem(menu: SystemMenu, permissions: string[]): NavItem | null {
  if (menu.visible === false) return null
  if (menu.type === 'button') return null

  const icon = menu.icon ? iconMap[menu.icon] : undefined
  const canAccessSelf = canAccessMenuCode(menu.code, permissions)
  const items = collectLeafLinks(menu.children || [], permissions)

  if (items.length > 0) {
    return { title: menu.name, icon, items }
  }

  if (!menu.path || !canAccessSelf) return null
  return { title: menu.name, url: menu.path, icon }
}

export function buildNavGroupsFromMenus(
  menus: SystemMenu[],
  permissions: string[] = []
): NavGroup[] {
  return sortMenusBySort(menus)
    .filter((groupMenu) => groupMenu.type !== 'button' && groupMenu.visible !== false)
    .map((groupMenu) => {
      const children = sortMenusBySort(groupMenu.children || [])
      const items = children
        .map((menu) => toNavItem(menu, permissions))
        .filter((item): item is NavItem => !!item)

      if (items.length === 0 && groupMenu.path) {
        const rootItem = toNavItem(groupMenu, permissions)
        if (rootItem && 'url' in rootItem) {
          return { title: groupMenu.name, items: [rootItem] }
        }
      }

      if (items.length === 0) return null
      return { title: groupMenu.name, items }
    })
    .filter((group): group is NavGroup => !!group)
}
