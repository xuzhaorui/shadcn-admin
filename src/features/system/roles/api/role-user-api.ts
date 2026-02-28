import { http, type PaginatedResponse } from '@/lib/http-client'
import { type UserLite } from '../types/user-lite'

/**
 * 用户列表查询参数
 */
export interface UserListParams {
    page: number
    pageSize: number
    keyword?: string // 用户名/姓名/手机号
}

/**
 * 批量添加/移除用户参数
 */
export interface BatchUserParams {
    userIds: string[]
}

/**
 * 角色用户关联 API 服务
 */
export const roleUserApi = {
    /**
     * 获取角色已分配用户
     */
    getRoleUsers: (roleId: string, params: UserListParams) => {
        return http.get<PaginatedResponse<UserLite>>(
            `/system/roles/${roleId}/users`,
            { params }
        )
    },

    /**
     * 获取可分配用户列表
     */
    getAvailableUsers: (roleId: string, params: UserListParams) => {
        return http.get<PaginatedResponse<UserLite>>(
            '/system/users/available-for-role',
            { params: { ...params, roleId } }
        )
    },

    /**
     * 批量添加用户到角色
     */
    addUsersToRole: (roleId: string, params: BatchUserParams) => {
        return http.post<void>(`/system/roles/${roleId}/users`, params)
    },

    /**
     * 批量移除角色的用户
     */
    removeUsersFromRole: (roleId: string, params: BatchUserParams) => {
        return http.delete<void>(`/system/roles/${roleId}/users`, { data: params })
    },
}
