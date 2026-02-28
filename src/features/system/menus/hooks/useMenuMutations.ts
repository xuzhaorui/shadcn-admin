import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { menuApi } from '../api/menu-api'
import { type MenuFormData } from '../data/schema'

function mapMenuErrorMessage(message: string): string {
    const text = message.toLowerCase()
    if (text.includes('cannot delete menu bound by roles') || text.includes('menu bound by roles')) {
        return '该菜单已被角色绑定，请先解除角色关联后再删除'
    }
    return message
}

/**
 * Hook to create menu
 */
export function useCreateMenu() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: MenuFormData) => menuApi.createMenu(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['menus'] })
            toast.success('菜单创建成功')
        },
        onError: (error: Error) => {
            toast.error(`创建失败：${mapMenuErrorMessage(error.message)}`)
        },
    })
}

/**
 * Hook to update menu
 */
export function useUpdateMenu() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<MenuFormData> }) =>
            menuApi.updateMenu(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['menus'] })
            toast.success('菜单更新成功')
        },
        onError: (error: Error) => {
            toast.error(`更新失败：${mapMenuErrorMessage(error.message)}`)
        },
    })
}

/**
 * Hook to delete menu
 */
export function useDeleteMenu() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string) => menuApi.deleteMenu(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['menus'] })
            toast.success('菜单删除成功')
        },
        onError: (error: Error) => {
            toast.error(`删除失败：${mapMenuErrorMessage(error.message)}`)
        },
    })
}
