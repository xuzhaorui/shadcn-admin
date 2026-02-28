import { useQuery } from '@tanstack/react-query'
import { roleApi, type RoleListParams } from '../api/role-api'

export function useRoleList(params: RoleListParams) {
  return useQuery({
    queryKey: ['roles', 'list', params],
    queryFn: async () => roleApi.getRoleList(params),
    staleTime: 1000 * 60 * 5,
    placeholderData: (previousData) => previousData,
  })
}

export function useRoleDetail(id: string | null) {
  return useQuery({
    queryKey: ['roles', 'detail', id],
    queryFn: async () => roleApi.getRoleDetail(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  })
}
