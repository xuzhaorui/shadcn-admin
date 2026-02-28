import { z } from 'zod'

// Online user schema
const onlineUserSchema = z.object({
    id: z.string(),
    username: z.string(),
    deptName: z.string(),
    ip: z.string(),
    location: z.string(),
    browser: z.string(),
    os: z.string(),
    loginTime: z.coerce.date(),
})
export type OnlineUser = z.infer<typeof onlineUserSchema>

export const onlineUserListSchema = z.array(onlineUserSchema)
