import { useQuery } from '@tanstack/react-query'
import { deptApi } from '../api/dept-api'

export function useDeptTree() {
  return useQuery({
    queryKey: ['depts', 'tree'],
    queryFn: () => deptApi.getDeptTree(),
    staleTime: 1000 * 60 * 5,
    placeholderData: (previousData) => previousData,
  })
}

