import { z } from 'zod'

// Role status
const roleStatusSchema = z.union([z.literal('active'), z.literal('inactive')])
export type RoleStatus = z.infer<typeof roleStatusSchema>

// Data scope (数据权限范围)
export const dataScopeSchema = z.enum([
    'all', // 全部数据权限
    'custom', // 自定义数据权限
    'dept', // 本部门数据权限
    'dept_down', // 本部门及以下数据权限
    'self', // 仅本人数据权限
])
export type DataScope = z.infer<typeof dataScopeSchema>

// Role schema - Minimalist approach per Musk's philosophy
export const roleSchema = z.object({
    id: z.string(),
    code: z.string(),
    name: z.string(),
    status: roleStatusSchema,

    // 数据权限
    dataScope: dataScopeSchema,
    customDeptIds: z.array(z.string()).optional(), // dataScope=custom 时必填

    // 菜单/按钮权限（统一树）
    permissionNodeIds: z.array(z.string()).default([]), // 目录/菜单/按钮节点ID集合
})
export type Role = z.infer<typeof roleSchema>


// Role form validation schema - Minimalist approach
export const roleFormSchema = z
    .object({
        code: z
            .string()
            .min(2, '角色编码至少2个字符')
            .max(20, '角色编码最多20个字符')
            .regex(/^[a-z0-9_]+$/, '仅支持小写字母、数字和下划线'),

        name: z
            .string()
            .min(2, '角色名称至少2个字符')
            .max(20, '角色名称最多20个字符'),

        dataScope: dataScopeSchema,

        customDeptIds: z.array(z.string()).optional(),

        status: roleStatusSchema,
    })
    .superRefine((val, ctx) => {
        if (
            val.dataScope === 'custom' &&
            (!val.customDeptIds || val.customDeptIds.length === 0)
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: '自定义数据权限必须选择至少一个部门',
                path: ['customDeptIds'],
            })
        }
    })

export type RoleFormData = z.infer<typeof roleFormSchema>

