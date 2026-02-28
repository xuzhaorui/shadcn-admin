import { useMemo } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { ADMIN_PERMISSION, getPermissionsFromUser, hasPermission } from '@/lib/permission'

export function usePermission() {
  const user = useAuthStore((state) => state.auth.user)

  const permissions = useMemo(() => getPermissionsFromUser(user), [user])
  const isAdmin = permissions.includes(ADMIN_PERMISSION)

  return {
    permissions,
    isAdmin,
    can: (permission: string) => hasPermission(permissions, permission),
  }
}
