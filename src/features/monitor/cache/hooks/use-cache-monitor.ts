import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cacheApi } from '../api/cache-api'

export function useCacheSummary() {
  return useQuery({
    queryKey: ['monitor', 'cache-summary'],
    queryFn: cacheApi.getSummary,
    staleTime: 5 * 1000,
    refetchInterval: 8 * 1000,
  })
}

export function useClearCache() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: cacheApi.clearCache,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitor', 'cache-summary'] })
    },
  })
}

export function useClearAllCache() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: cacheApi.clearAll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitor', 'cache-summary'] })
    },
  })
}
