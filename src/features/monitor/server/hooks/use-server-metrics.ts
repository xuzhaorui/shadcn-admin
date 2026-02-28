import { useQuery } from '@tanstack/react-query'
import { serverApi } from '../api/server-api'

export function useServerMetrics() {
  return useQuery({
    queryKey: ['monitor', 'server-metrics'],
    queryFn: serverApi.getMetrics,
    staleTime: 5 * 1000,
    refetchInterval: 10 * 1000,
  })
}
