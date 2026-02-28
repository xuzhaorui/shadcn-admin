import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { deptApi } from '../api/dept-api'
import { type DeptFormData } from '../data/schema'

export function useCreateDept() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: DeptFormData) => deptApi.createDept(data),
    onSuccess: () => {
      toast.success('部门创建成功')
      queryClient.invalidateQueries({ queryKey: ['depts', 'tree'] })
    },
  })
}

export function useUpdateDept() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DeptFormData> }) => deptApi.updateDept(id, data),
    onSuccess: () => {
      toast.success('部门更新成功')
      queryClient.invalidateQueries({ queryKey: ['depts', 'tree'] })
    },
  })
}

export function useDeleteDept() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deptApi.deleteDept(id),
    onSuccess: () => {
      toast.success('部门删除成功')
      queryClient.invalidateQueries({ queryKey: ['depts', 'tree'] })
    },
  })
}

export function useToggleDeptStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'inactive' }) =>
      deptApi.updateDeptStatus(id, status),
    onSuccess: (_, variables) => {
      toast.success(variables.status === 'active' ? '部门已启用' : '部门已禁用')
      queryClient.invalidateQueries({ queryKey: ['depts', 'tree'] })
    },
  })
}
