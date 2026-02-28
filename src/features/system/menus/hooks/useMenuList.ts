import { useQuery } from '@tanstack/react-query'
import { menuApi } from '../api/menu-api'

/**
 * Hook to fetch menu list
 */
export function useMenuList() {
    return useQuery({
        queryKey: ['menus'],
        queryFn: () => menuApi.getMenuList(),
        placeholderData: (previousData) => previousData,
    })
}

/**
 * Hook to fetch menu detail
 */
export function useMenuDetail(id: string | null) {
    return useQuery({
        queryKey: ['menus', id],
        queryFn: () => (id ? menuApi.getMenuDetail(id) : null),
        enabled: !!id,
    })
}
