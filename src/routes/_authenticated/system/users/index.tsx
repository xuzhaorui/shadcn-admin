import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Users } from '@/features/users'

const usersSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  status: z
    .array(z.union([z.literal('active'), z.literal('inactive')]))
    .optional()
    .catch([]),
  role: z.array(z.string()).optional().catch([]),
  username: z.string().optional().catch(''),
})

export const Route = createFileRoute('/_authenticated/system/users/')({
  validateSearch: usersSearchSchema,
  component: Users,
})
