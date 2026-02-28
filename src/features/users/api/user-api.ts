import { http, type PaginatedResponse } from '@/lib/http-client'
import { type User } from '../data/schema'

const toFrontendStatus = (status?: string): 'active' | 'inactive' =>
  status === 'enabled' || status === 'active' ? 'active' : 'inactive'

const toBackendStatus = (status?: 'active' | 'inactive'): 'enabled' | 'disabled' =>
  status === 'inactive' ? 'disabled' : 'enabled'

const mapUserFromApi = (user: User): User => ({
  ...user,
  status: toFrontendStatus(user.status),
})

export interface UserListParams {
  page: number
  pageSize: number
  keyword?: string
  status?: 'active' | 'inactive'
  departmentId?: string
  roleIds?: string[]
  startTime?: string
  endTime?: string
}

export interface UserCreateData {
  username: string
  realName: string
  email: string
  phone?: string
  departmentId: string
  roleIds: string[]
  status: 'active' | 'inactive'
  password?: string
}

export interface BatchDeleteParams {
  ids: string[]
}

export interface ToggleStatusParams {
  status: 'active' | 'inactive'
}

export interface ResetPasswordParams {
  newPassword: string
}

export interface UserRoleAssignParams {
  roleIds: string[]
}

export const userApi = {
  getUserList: (params: UserListParams) => {
    return http.get<PaginatedResponse<User>>('/system/users/list', {
      params: {
        ...params,
        ...(params.status ? { status: toBackendStatus(params.status) } : {}),
      },
    }).then((page) => ({
      ...page,
      list: page.list.map(mapUserFromApi),
    }))
  },

  getUserDetail: (id: string) => {
    return http.get<User>(`/system/users/${id}`).then(mapUserFromApi)
  },

  createUser: (data: UserCreateData) => {
    const { roleIds: _roleIds, ...payload } = data
    return http.post<{ id: string }>('/system/users', {
      ...payload,
      status: toBackendStatus(data.status),
    })
  },

  updateUser: (id: string, data: Partial<UserCreateData>) => {
    const { roleIds: _roleIds, ...payload } = data
    return http.put<void>(`/system/users/${id}`, {
      ...payload,
      ...(data.status ? { status: toBackendStatus(data.status) } : {}),
    })
  },

  assignUserRoles: (id: string, params: UserRoleAssignParams) => {
    return http.post<void>(`/system/users/${id}/roles`, params)
  },

  deleteUser: (id: string) => {
    return http.delete<void>(`/system/users/${id}`)
  },

  batchDeleteUsers: (params: BatchDeleteParams) => {
    return http.delete<void>('/system/users/batch', { data: params })
  },

  toggleUserStatus: (id: string, params: ToggleStatusParams) => {
    return http.patch<void>(`/system/users/${id}/status`, {
      status: toBackendStatus(params.status),
    })
  },

  resetPassword: (id: string, params: ResetPasswordParams) => {
    return http.post<void>(`/system/users/${id}/reset-password`, params)
  },

  exportUsers: (params: UserListParams) => {
    return http.get<string>('/system/users/export', { params })
  },
}
