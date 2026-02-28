import { z } from 'zod'

/**
 * 权限节点类型
 */
export type PermissionNodeType = 'directory' | 'menu' | 'button'

/**
 * 权限节点实体
 */
export interface PermissionNode {
    id: string // 节点ID（唯一）
    name: string // 节点名称
    type: PermissionNodeType // directory/menu/button
    code?: string // button 可带 action code（如 system:roles:create）
    parentId?: string | null
    sort?: number
    children?: PermissionNode[]
}

/**
 * 权限节点 Schema
 */
const permissionNodeSchema: z.ZodType<PermissionNode> = z.lazy(() =>
    z.object({
        id: z.string(),
        name: z.string(),
        type: z.enum(['directory', 'menu', 'button']),
        code: z.string().optional(),
        parentId: z.string().nullable().optional(),
        sort: z.number(),
        children: z.array(permissionNodeSchema).optional(),
    })
)

export const permissionTreeSchema = z.array(permissionNodeSchema)

/**
 * 角色已分配权限
 */
export interface RolePermissions {
    menuIds: string[]
    permissionCodes: string[]
}

export const rolePermissionsSchema = z.object({
    menuIds: z.array(z.string()),
    permissionCodes: z.array(z.string()),
})
