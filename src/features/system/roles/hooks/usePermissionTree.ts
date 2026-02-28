import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { menuApi } from '@/features/system/menus/api/menu-api'
import { type Menu } from '@/features/system/menus/data/schema'
import {
  permissionApi,
  type AssignDataScopeParams,
  type AssignPermissionsParams,
} from '../api/permission-api'
import { type PermissionNode } from '../types/permission'

function mapMenuNodeToPermission(menu: Menu): PermissionNode {
  return {
    id: menu.id,
    name: menu.name,
    type: menu.type,
    code: menu.code,
    parentId: menu.parentId,
    sort: menu.sort,
    children: menu.children?.map(mapMenuNodeToPermission),
  }
}

export function usePermissionTree() {
  return useQuery({
    queryKey: ['menus', 'permission-tree'],
    queryFn: async () => {
      const menuTree = await menuApi.getMenuList()
      return menuTree.map(mapMenuNodeToPermission)
    },
    staleTime: 1000 * 60 * 10,
  })
}

export function useRolePermissions(roleId: string | null) {
  return useQuery({
    queryKey: ['roles', roleId, 'permissions'],
    queryFn: async () => permissionApi.getRolePermissions(roleId!),
    enabled: !!roleId,
    staleTime: 1000 * 60 * 5,
  })
}

export function useAssignPermissions() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      roleId,
      params,
    }: {
      roleId: string
      params: AssignPermissionsParams
    }) => permissionApi.assignPermissions(roleId, params),
    onSuccess: (_, variables) => {
      toast.success('权限更新成功')
      queryClient.invalidateQueries({
        queryKey: ['roles', variables.roleId, 'permissions'],
      })
      queryClient.invalidateQueries({ queryKey: ['roles', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['menus', 'permission-tree'] })
    },
  })
}

export function useAssignDataScope() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      roleId,
      params,
    }: {
      roleId: string
      params: AssignDataScopeParams
    }) => permissionApi.assignDataScope(roleId, params),
    onSuccess: (_, variables) => {
      toast.success('数据权限更新成功')
      queryClient.invalidateQueries({ queryKey: ['roles', 'detail', variables.roleId] })
      queryClient.invalidateQueries({ queryKey: ['roles', 'list'] })
    },
  })
}
