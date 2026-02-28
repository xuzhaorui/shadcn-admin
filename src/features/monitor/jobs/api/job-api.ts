import { http, type PaginatedResponse } from '@/lib/http-client'
import { type Job, type JobInvokeTarget, type MisfirePolicy } from '../data/schema'

export interface JobListParams {
  page: number
  pageSize: number
  keyword?: string
  status?: 'running' | 'paused'
}

export interface JobUpsertPayload {
  name: string
  group: string
  invokeTarget: JobInvokeTarget
  cronExpression: string
  misfirePolicy: MisfirePolicy
  concurrent: boolean
  status: 'running' | 'paused'
  remark?: string
}

const normalizeInvokeTarget = (value?: string): JobInvokeTarget => {
  const next = value?.trim().toUpperCase()
  return next === 'DATA_BACKUP' ? 'DATA_BACKUP' : 'LOG_CLEANUP'
}

const normalizeMisfirePolicy = (value?: string): MisfirePolicy => {
  const next = value?.trim().toLowerCase() ?? 'default'
  if (next === 'ignore') return 'ignore'
  if (next === 'fireonce') return 'fireOnce'
  if (next === 'fireall') return 'fireAll'
  return 'default'
}

const mapJobFromApi = (
  item: Omit<Job, 'createdAt' | 'nextExecuteTime' | 'misfirePolicy' | 'invokeTarget'> & {
    createdAt: string
    nextExecuteTime?: string
    misfirePolicy: string
    invokeTarget: string
  }
): Job => ({
  ...item,
  invokeTarget: normalizeInvokeTarget(item.invokeTarget),
  misfirePolicy: normalizeMisfirePolicy(item.misfirePolicy),
  createdAt: new Date(item.createdAt),
  nextExecuteTime: item.nextExecuteTime ? new Date(item.nextExecuteTime) : undefined,
})

export const jobApi = {
  getJobList: async (params: JobListParams): Promise<PaginatedResponse<Job>> => {
    const page = await http.get<
      PaginatedResponse<
        Omit<Job, 'createdAt' | 'nextExecuteTime' | 'misfirePolicy' | 'invokeTarget'> & {
          createdAt: string
          nextExecuteTime?: string
          misfirePolicy: string
          invokeTarget: string
        }
      >
    >('/monitor/jobs/list', { params })
    return {
      ...page,
      list: page.list.map(mapJobFromApi),
    }
  },

  create: async (payload: JobUpsertPayload): Promise<string> => {
    const res = await http.post<{ id: string }>('/monitor/jobs', payload)
    return res.id
  },

  update: async (id: string, payload: JobUpsertPayload): Promise<void> => {
    await http.put<void>(`/monitor/jobs/${id}`, payload)
  },

  remove: async (id: string): Promise<void> => {
    await http.delete<void>(`/monitor/jobs/${id}`)
  },

  toggleStatus: async (id: string, status: 'running' | 'paused'): Promise<void> => {
    await http.patch<void>(`/monitor/jobs/${id}/status`, { status })
  },

  execute: async (id: string): Promise<void> => {
    await http.post<void>(`/monitor/jobs/${id}/execute`)
  },
}
