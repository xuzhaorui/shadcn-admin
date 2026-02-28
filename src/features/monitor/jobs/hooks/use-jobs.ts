import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { jobApi, type JobListParams, type JobUpsertPayload } from '../api/job-api'

export function useJobs(params: JobListParams) {
  return useQuery({
    queryKey: ['monitor', 'jobs', params],
    queryFn: () => jobApi.getJobList(params),
    staleTime: 30 * 1000,
  })
}

export function useToggleJobStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'running' | 'paused' }) =>
      jobApi.toggleStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitor', 'jobs'] })
    },
  })
}

export function useCreateJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: JobUpsertPayload) => jobApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitor', 'jobs'] })
    },
  })
}

export function useUpdateJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: JobUpsertPayload }) =>
      jobApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitor', 'jobs'] })
    },
  })
}

export function useDeleteJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => jobApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitor', 'jobs'] })
    },
  })
}

export function useExecuteJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => jobApi.execute(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitor', 'jobs'] })
    },
  })
}
