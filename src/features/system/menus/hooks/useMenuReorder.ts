import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { menuApi } from '../api/menu-api'

/**
 * Hook to reorder menus
 */
export function useMenuReorder() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ parentId, sortedIds }: { parentId: string | null; sortedIds: string[] }) =>
            menuApi.reorderMenus(parentId, sortedIds),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['menus'] })
            toast.success('菜单排序已更新')
        },
        onError: (error: Error) => {
            toast.error(`排序失败: ${error.message}`)
        },
    })
}
