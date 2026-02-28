import { http } from '@/lib/http-client'

export interface AssignPermissionsParams {
  permissionNodeIds: string[]
}

export interface AssignDataScopeParams {
  dataScope: 'all' | 'custom' | 'dept' | 'dept_down' | 'self'
  customDeptIds?: string[]
}

export const permissionApi = {
  getRolePermissions: (roleId: string) => {
    return http.get<string[]>(`/system/roles/${roleId}/permissions`).then((ids) => ({
      menuIds: ids,
      permissionCodes: [],
    }))
  },

  assignPermissions: (roleId: string, params: AssignPermissionsParams) => {
    return http.post<void>(`/system/roles/${roleId}/permissions`, {
      menuIds: params.permissionNodeIds,
    })
  },

  assignDataScope: (roleId: string, params: AssignDataScopeParams) => {
    return http.post<void>(`/system/roles/${roleId}/data-scope`, {
      dataScope: params.dataScope,
      deptIds: params.customDeptIds,
    })
  },
}
