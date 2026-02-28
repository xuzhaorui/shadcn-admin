import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { usePermission } from '@/hooks/use-permission'
import { userApi, type UserListParams, type UserCreateData } from '../api/user-api'
import { USER_PERMISSIONS } from '../constants/permissions'

export const userQueryKeys = {
  all: ['users'] as const,
  lists: () => [...userQueryKeys.all, 'list'] as const,
  list: (params: UserListParams) => [...userQueryKeys.lists(), params] as const,
  details: () => [...userQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...userQueryKeys.details(), id] as const,
}

export function useUserListQuery(params: UserListParams) {
  return useQuery({
    queryKey: userQueryKeys.list(params),
    queryFn: () => userApi.getUserList(params),
    staleTime: 1000 * 60 * 5,
    placeholderData: (previousData) => previousData,
  })
}

export function useUserDetailQuery(id: string, enabled = true) {
  return useQuery({
    queryKey: userQueryKeys.detail(id),
    queryFn: () => userApi.getUserDetail(id),
    enabled: enabled && !!id,
  })
}

export function useUserMutation() {
  const queryClient = useQueryClient()
  const { can } = usePermission()
  const canAssignRoles = can(USER_PERMISSIONS.ASSIGN_ROLES)

  return useMutation({
    mutationFn: async ({ id, data }: { id?: string; data: UserCreateData }) => {
      const targetRoleIds = data.roleIds || []
      if (!canAssignRoles && targetRoleIds.length > 0) {
        toast.warning('当前账号没有分配角色权限，已忽略角色变更')
      }
      if (id) {
        await userApi.updateUser(id, data)
        if (canAssignRoles) {
          await userApi.assignUserRoles(id, { roleIds: targetRoleIds })
        }
        return { id }
      }

      const created = await userApi.createUser(data)
      if (canAssignRoles) {
        await userApi.assignUserRoles(created.id, { roleIds: targetRoleIds })
      }
      return created
    },
    onSuccess: (_, variables) => {
      const action = variables.id ? '更新' : '创建'
      toast.success(`用户${action}成功`)
      queryClient.invalidateQueries({ queryKey: userQueryKeys.lists() })
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: userQueryKeys.detail(variables.id) })
      }
    },
    onError: () => {
      toast.error('用户保存失败')
    },
  })
}

export function useDeleteUserMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => userApi.deleteUser(id),
    onSuccess: () => {
      toast.success('用户删除成功')
      queryClient.invalidateQueries({ queryKey: userQueryKeys.lists() })
    },
    onError: () => {
      toast.error('用户删除失败')
    },
  })
}

export function useBatchDeleteUsersMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (ids: string[]) => userApi.batchDeleteUsers({ ids }),
    onSuccess: (_, ids) => {
      toast.success(`成功删除 ${ids.length} 个用户`)
      queryClient.invalidateQueries({ queryKey: userQueryKeys.lists() })
    },
    onError: () => {
      toast.error('批量删除用户失败')
    },
  })
}

export function useToggleUserStatusMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'inactive' }) =>
      userApi.toggleUserStatus(id, { status }),
    onSuccess: (_, variables) => {
      const statusText = variables.status === 'active' ? '启用' : '禁用'
      toast.success(`用户${statusText}成功`)
      queryClient.invalidateQueries({ queryKey: userQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: userQueryKeys.detail(variables.id) })
    },
    onError: () => {
      toast.error('用户状态更新失败')
    },
  })
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) =>
      userApi.resetPassword(id, { newPassword }),
    onSuccess: () => {
      toast.success('密码重置成功')
    },
    onError: () => {
      toast.error('密码重置失败')
    },
  })
}

export function useExportUsersMutation() {
  return useMutation({
    mutationFn: (params: UserListParams) => userApi.exportUsers(params),
    onSuccess: () => {
      toast.success('导出接口已连通，后端当前返回占位结果')
    },
    onError: () => {
      toast.error('导出失败，请稍后重试')
    },
  })
}
