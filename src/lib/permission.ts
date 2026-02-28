export const ADMIN_PERMISSION = '*'
const ALWAYS_ALLOWED_PATHS = new Set(['/', '/home'])

export const MENU_CODE_PERMISSION_MAP: Record<string, string> = {
  'system:users': 'system:users:view',
  'system:roles': 'system:roles:view',
  'system:menus': 'system:menus:view',
  'system:depts': 'system:departments:view',
  'system:logs': 'system:logs:view',
  'system:logs:operation': 'system:logs:view',
  'system:logs:login': 'system:logs:view',
}

const ACTION_SUFFIXES = new Set([
  'view',
  'create',
  'edit',
  'delete',
  'export',
  'import',
  'reset-pwd',
  'assign',
  'assign-perms',
  'assign-data-scope',
  'assign-users',
])

function toMenuCodeFromPath(pathname: string): string | null {
  const cleanPath = pathname.split('?')[0]?.split('#')[0] ?? pathname
  const normalized = cleanPath.replace(/\/+$/, '')
  if (!normalized || normalized === '/') return 'dashboard'
  if (!normalized.startsWith('/')) return null
  return normalized.slice(1).replace(/\//g, ':')
}

function toPermissionByMenuCode(code: string): string {
  const normalized = code.trim().toLowerCase()
  if (!normalized) return ''

  const mapped = MENU_CODE_PERMISSION_MAP[normalized]
  if (mapped) return mapped

  const parts = normalized.split(':')
  const last = parts[parts.length - 1]

  if (parts.length >= 3 || ACTION_SUFFIXES.has(last)) {
    return normalized
  }

  return `${normalized}:view`
}

export function getPermissionsFromUser(
  user: { permissions?: string[]; role?: string[] } | null | undefined
): string[] {
  if (!user) return []
  if (Array.isArray(user.permissions)) return user.permissions
  if (Array.isArray(user.role)) return user.role
  return []
}

export function hasPermission(permissions: string[] | undefined, permission: string): boolean {
  const list = permissions || []
  return list.includes(ADMIN_PERMISSION) || list.includes(permission)
}

function normalizePath(pathname: string): string {
  const cleanPath = pathname.split('?')[0]?.split('#')[0] ?? pathname
  return cleanPath.replace(/\/+$/, '') || '/'
}

export function canAccessPath(pathname: string, permissions: string[] | undefined): boolean {
  const normalizedPath = normalizePath(pathname)
  if (ALWAYS_ALLOWED_PATHS.has(normalizedPath)) {
    return true
  }

  const menuCode = toMenuCodeFromPath(pathname)
  if (!menuCode) return true

  const permission = toPermissionByMenuCode(menuCode)
  if (!permission) return true

  return hasPermission(permissions, permission)
}

export function canAccessMenuCode(code: string | undefined, permissions: string[] | undefined): boolean {
  if (!code) return true
  const required = toPermissionByMenuCode(code)
  if (!required) return true
  return hasPermission(permissions, required)
}

type PermissionMenu = {
  path?: string
  code?: string
  type?: string
  visible?: boolean
  children?: PermissionMenu[]
}

function collectAccessiblePaths(
  menus: PermissionMenu[],
  permissions: string[] | undefined,
  out: Set<string>
): void {
  for (const menu of menus) {
    if (menu.visible === false || menu.type === 'button') continue

    if (menu.path && canAccessMenuCode(menu.code, permissions)) {
      out.add(normalizePath(menu.path))
    }

    if (menu.children?.length) {
      collectAccessiblePaths(menu.children, permissions, out)
    }
  }
}

export function canAccessPathByMenus(
  pathname: string,
  menus: PermissionMenu[] | undefined,
  permissions: string[] | undefined
): boolean {
  const normalizedPath = normalizePath(pathname)
  if (ALWAYS_ALLOWED_PATHS.has(normalizedPath)) return true
  if (!menus || menus.length === 0) return false

  const allowedPaths = new Set<string>()
  collectAccessiblePaths(menus, permissions, allowedPaths)
  return allowedPaths.has(normalizedPath)
}

