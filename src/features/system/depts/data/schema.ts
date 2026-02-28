import { z } from 'zod'

// Dept status
const deptStatusSchema = z.union([z.literal('active'), z.literal('inactive')])
export type DeptStatus = z.infer<typeof deptStatusSchema>

// Dept schema
const baseDeptSchema = z.object({
    id: z.string(),
    parentId: z.string().nullable(),
    name: z.string(),
    code: z.string(),
    sort: z.number(),
    status: deptStatusSchema,
})

export type Dept = z.infer<typeof baseDeptSchema> & {
    children?: Dept[]
}

export const deptListSchema = z.array(baseDeptSchema)

export const deptFormSchema = z.object({
    parentId: z.string().nullable(),
    name: z.string().min(1, '请输入部门名称'),
    code: z.string().min(1, '请输入部门编码'),
    sort: z.number().int().min(0, '排序不能小于 0').default(0),
    status: deptStatusSchema.default('active'),
})

export type DeptFormData = z.infer<typeof deptFormSchema>
