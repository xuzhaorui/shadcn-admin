/**
 * 用户管理权限点常量
 * 按 agend-modules/system-users.md 规范定义
 */
export const USER_PERMISSIONS = {
    VIEW: 'system:users:view',
    CREATE: 'system:users:create',
    EDIT: 'system:users:edit',
    DELETE: 'system:users:delete',
    ASSIGN_ROLES: 'system:users:assign-roles',
    RESET_PWD: 'system:users:reset-pwd',
    EXPORT: 'system:users:export',
} as const

export type UserPermission = typeof USER_PERMISSIONS[keyof typeof USER_PERMISSIONS]
