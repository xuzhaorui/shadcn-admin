import { z } from 'zod'

// Job status
const jobStatusSchema = z.union([z.literal('running'), z.literal('paused')])
export type JobStatus = z.infer<typeof jobStatusSchema>

// Misfire policy
const misfirePolicySchema = z.union([
    z.literal('default'),
    z.literal('ignore'),
    z.literal('fireOnce'),
    z.literal('fireAll'),
])
export type MisfirePolicy = z.infer<typeof misfirePolicySchema>

const jobInvokeTargetSchema = z.union([z.literal('LOG_CLEANUP'), z.literal('DATA_BACKUP')])
export type JobInvokeTarget = z.infer<typeof jobInvokeTargetSchema>

// Job schema
const jobSchema = z.object({
    id: z.string(),
    name: z.string(),
    group: z.string(),
    invokeTarget: jobInvokeTargetSchema,
    cronExpression: z.string(),
    misfirePolicy: misfirePolicySchema,
    concurrent: z.boolean(),
    status: jobStatusSchema,
    remark: z.string().optional(),
    createdAt: z.coerce.date(),
    nextExecuteTime: z.coerce.date().optional(),
})
export type Job = z.infer<typeof jobSchema>

export const jobListSchema = z.array(jobSchema)
