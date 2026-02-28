import { http, type PaginatedResponse } from '@/lib/http-client'
import { type Role } from '../data/schema'

interface RoleApiModel extends Omit<Role, 'permissionNodeIds'> {
    permissionNodeIds?: string[]
    menuIds?: string[]
}

const toFrontendStatus = (status?: string): 'active' | 'inactive' =>
    status === 'enabled' || status === 'active' ? 'active' : 'inactive'

const toBackendStatus = (status?: 'active' | 'inactive'): 'enabled' | 'disabled' =>
    status === 'inactive' ? 'disabled' : 'enabled'

const mapRoleFromApi = (role: RoleApiModel): Role => ({
    ...role,
    status: toFrontendStatus(role.status),
    permissionNodeIds: role.permissionNodeIds ?? role.menuIds ?? [],
})

/**
 * 角色列表查询参数
 */
export interface RoleListParams {
    page: number
    pageSize: number
    keyword?: string // 关键词搜索 (角色编码/角色名称)
    status?: 'active' | 'inactive'
    dataScope?: 'all' | 'custom' | 'dept' | 'dept_down' | 'self'
    startTime?: string // ISO 8601
    endTime?: string // ISO 8601
}

/**
 * 角色创建/更新数据
 */
export interface RoleCreateData {
    code: string // 新增必填,更新不可修改
    name: string
    dataScope: 'all' | 'custom' | 'dept' | 'dept_down' | 'self'
    customDeptIds?: string[] // dataScope=custom 必填
    status: 'active' | 'inactive'
}

/**
 * 批量删除参数
 */
export interface BatchDeleteParams {
    ids: string[]
}

/**
 * 状态切换参数
 */
export interface ToggleStatusParams {
    status: 'active' | 'inactive'
}

/**
 * 角色管理 API 服务
 */
export const roleApi = {
    /**
     * 获取角色列表
     */
    getRoleList: (params: RoleListParams) => {
        return http.get<PaginatedResponse<RoleApiModel>>('/system/roles/list', {
            params: {
                ...params,
                ...(params.status ? { status: toBackendStatus(params.status) } : {}),
            },
        }).then((page) => ({
            ...page,
            list: page.list.map(mapRoleFromApi),
        }))
    },

    /**
     * 获取角色详情
     */
    getRoleDetail: (id: string) => {
        return http.get<RoleApiModel>(`/system/roles/${id}`).then(mapRoleFromApi)
    },

    /**
     * 新增角色
     */
    createRole: (data: RoleCreateData) => {
        return http.post<{ id: string }>('/system/roles', {
            ...data,
            status: toBackendStatus(data.status),
        })
    },

    /**
     * 更新角色
     */
    updateRole: (id: string, data: Partial<RoleCreateData>) => {
        return http.put<void>(`/system/roles/${id}`, {
            ...data,
            ...(data.status ? { status: toBackendStatus(data.status) } : {}),
        })
    },

    /**
     * 删除角色
     */
    deleteRole: (id: string) => {
        return http.delete<void>(`/system/roles/${id}`)
    },

    /**
     * 批量删除角色
     */
    batchDeleteRoles: (params: BatchDeleteParams) => {
        return http.delete<void>('/system/roles/batch', { data: { ids: params.ids } })
    },

    /**
     * 启用/禁用角色
     */
    toggleRoleStatus: (id: string, params: ToggleStatusParams) => {
        return http.patch<void>(`/system/roles/${id}/status`, {
            status: toBackendStatus(params.status),
        })
    },

    /**
     * 导出角色列表
     * 支持两种模式：文件流（blob）或下载链接（url）
     */
    exportRoles: (params: RoleListParams) => {
        return http.get<string>('/system/roles/export', {
            params: {
                ...params,
                ...(params.status ? { status: toBackendStatus(params.status) } : {}),
            },
        })
    },
}
