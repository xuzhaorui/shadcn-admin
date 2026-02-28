import { z } from 'zod'

/**
 * 用户简化类型（用于分配用户功能）
 */
export interface UserLite {
    id: string
    username: string
    name?: string
    phone?: string
    email?: string
    status?: 'active' | 'inactive'
}

export const userLiteSchema = z.object({
    id: z.string(),
    username: z.string(),
    name: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    status: z.enum(['active', 'inactive']).optional(),
})
