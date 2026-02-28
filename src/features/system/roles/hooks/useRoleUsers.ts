import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  roleUserApi,
  type BatchUserParams,
  type UserListParams,
} from '../api/role-user-api'

export function useRoleUsers(roleId: string | null, params: UserListParams) {
  return useQuery({
    queryKey: ['roles', roleId, 'users', params],
    queryFn: async () => roleUserApi.getRoleUsers(roleId!, params),
    enabled: !!roleId,
    staleTime: 1000 * 60 * 2,
  })
}

export function useAvailableUsers(roleId: string | null, params: UserListParams) {
  return useQuery({
    queryKey: ['roles', roleId, 'available-users', params],
    queryFn: async () => roleUserApi.getAvailableUsers(roleId!, params),
    enabled: !!roleId,
    staleTime: 1000 * 60 * 2,
  })
}

export function useAddUsersToRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      roleId,
      params,
    }: {
      roleId: string
      params: BatchUserParams
    }) => roleUserApi.addUsersToRole(roleId, params),
    onSuccess: (_, variables) => {
      toast.success('已添加用户到角色')
      queryClient.invalidateQueries({ queryKey: ['roles', variables.roleId, 'users'] })
      queryClient.invalidateQueries({ queryKey: ['roles', variables.roleId, 'available-users'] })
      queryClient.invalidateQueries({ queryKey: ['roles', 'detail', variables.roleId] })
      queryClient.invalidateQueries({ queryKey: ['users', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['users', 'detail'] })
    },
  })
}

export function useRemoveUsersFromRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      roleId,
      params,
    }: {
      roleId: string
      params: BatchUserParams
    }) => roleUserApi.removeUsersFromRole(roleId, params),
    onSuccess: (_, variables) => {
      toast.success('已从角色移除用户')
      queryClient.invalidateQueries({ queryKey: ['roles', variables.roleId, 'users'] })
      queryClient.invalidateQueries({ queryKey: ['roles', variables.roleId, 'available-users'] })
      queryClient.invalidateQueries({ queryKey: ['roles', 'detail', variables.roleId] })
      queryClient.invalidateQueries({ queryKey: ['users', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['users', 'detail'] })
    },
  })
}
