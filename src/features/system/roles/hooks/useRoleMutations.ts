import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
    roleApi,
    type RoleCreateData,
    type BatchDeleteParams,
    type ToggleStatusParams,
} from '../api/role-api'

/**
 * 新增角色 Mutation
 */
export function useCreateRole() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: RoleCreateData) => roleApi.createRole(data),
        onSuccess: () => {
            toast.success('角色创建成功')
            queryClient.invalidateQueries({ queryKey: ['roles', 'list'] })
        },
        onError: () => {
            toast.error('角色创建失败')
        },
    })
}

/**
 * 更新角色 Mutation
 */
export function useUpdateRole() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<RoleCreateData> }) =>
            roleApi.updateRole(id, data),
        onSuccess: (_, variables) => {
            toast.success('角色更新成功')
            queryClient.invalidateQueries({ queryKey: ['roles', 'list'] })
            queryClient.invalidateQueries({
                queryKey: ['roles', 'detail', variables.id],
            })
        },
        onError: () => {
            toast.error('角色更新失败')
        },
    })
}

/**
 * 删除角色 Mutation
 */
export function useDeleteRole() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string) => roleApi.deleteRole(id),
        onSuccess: () => {
            toast.success('角色删除成功')
            queryClient.invalidateQueries({ queryKey: ['roles', 'list'] })
        },
        onError: () => {
            toast.error('角色删除失败')
        },
    })
}

/**
 * 批量删除角色 Mutation
 */
export function useBatchDeleteRoles() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (params: BatchDeleteParams) => roleApi.batchDeleteRoles(params),
        onSuccess: () => {
            toast.success('批量删除成功')
            queryClient.invalidateQueries({ queryKey: ['roles', 'list'] })
        },
        onError: () => {
            toast.error('批量删除失败')
        },
    })
}

/**
 * 切换角色状态 Mutation
 */
export function useToggleRoleStatus() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, params }: { id: string; params: ToggleStatusParams }) =>
            roleApi.toggleRoleStatus(id, params),
        onSuccess: (_, variables) => {
            toast.success('状态更新成功')
            queryClient.invalidateQueries({ queryKey: ['roles', 'list'] })
            queryClient.invalidateQueries({
                queryKey: ['roles', 'detail', variables.id],
            })
        },
        onError: () => {
            toast.error('状态更新失败')
        },
    })
}
