import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Roles } from '@/features/system/roles'

const rolesSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  keyword: z.string().optional().catch(''),
  status: z
    .array(z.union([z.literal('active'), z.literal('inactive')]))
    .optional()
    .catch([]),
})

export const Route = createFileRoute('/_authenticated/system/roles/')({
  validateSearch: rolesSearchSchema,
  component: Roles,
})
