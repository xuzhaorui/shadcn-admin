import { z } from 'zod'

const menuTypeSchema = z.union([
  z.literal('directory'),
  z.literal('menu'),
  z.literal('button'),
])
export type MenuType = z.infer<typeof menuTypeSchema>

const baseMenuSchema = z.object({
  id: z.string(),
  parentId: z.string().nullable(),
  type: menuTypeSchema,
  name: z.string(),
  code: z.string(),
  path: z.string().optional(),
  icon: z.string().optional(),
  sort: z.number(),
  visible: z.boolean(),
})

export type Menu = z.infer<typeof baseMenuSchema> & {
  children?: Menu[]
}

export const menuListSchema = z.array(baseMenuSchema)

export const menuFormSchema = z
  .object({
    parentId: z.string().nullable(),
    type: menuTypeSchema,
    name: z
      .string()
      .min(2, 'Menu name must be at least 2 characters.')
      .max(20, 'Menu name must be at most 20 characters.'),
    code: z
      .string()
      .min(2, 'Menu code must be at least 2 characters.')
      .max(64, 'Menu code must be at most 64 characters.')
      .regex(/^[a-z0-9:_-]+$/, 'Code supports lowercase letters, numbers, :, _, and - only.'),
    path: z.string().optional(),
    icon: z.string().optional(),
    sort: z.number().min(0, 'Sort cannot be negative.'),
    visible: z.boolean().default(true),
  })
  .superRefine((val, ctx) => {
    if ((val.type === 'menu' || val.type === 'directory') && !val.path) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Menu and directory types require a route path.',
        path: ['path'],
      })
    }

    if (val.path && !val.path.startsWith('/')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Route path must start with /.',
        path: ['path'],
      })
    }
  })

export type MenuFormData = z.infer<typeof menuFormSchema>