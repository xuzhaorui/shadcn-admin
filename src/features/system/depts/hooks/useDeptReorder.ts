import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { deptApi } from '../api/dept-api'

export function useDeptReorder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ parentId, orderedIds }: { parentId: string | null; orderedIds: string[] }) =>
      deptApi.reorderDepts(parentId, orderedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['depts', 'tree'] })
      toast.success('部门排序已更新')
    },
  })
}
