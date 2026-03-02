import { z } from 'zod'

const warehouseStatusSchema = z.union([z.literal('active'), z.literal('inactive')])
export type WarehouseStatus = z.infer<typeof warehouseStatusSchema>

const warehouseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  status: warehouseStatusSchema,
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
})

export type Warehouse = z.infer<typeof warehouseSchema>
export const warehouseListSchema = z.array(warehouseSchema)

export const warehouseFormSchema = z.object({
  name: z.string().min(1, '请输入仓库名称').max(64, '仓库名称不能超过64个字符'),
  description: z.string().max(255, '仓库描述不能超过255个字符').optional(),
  status: warehouseStatusSchema.default('active'),
})

export type WarehouseFormData = z.infer<typeof warehouseFormSchema>
