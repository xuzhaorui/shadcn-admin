import { http } from '@/lib/http-client'
import { type Menu, type MenuFormData } from '../data/schema'

interface MenuApiModel {
  id: string
  parentId: string | null
  type: 'directory' | 'menu' | 'button'
  name: string
  code: string
  path?: string
  icon?: string
  sort: number
  visible: string
  status: string
  children?: MenuApiModel[]
}

const toBackendStatus = (status?: 'active' | 'inactive'): 'enabled' | 'disabled' =>
  status === 'inactive' ? 'disabled' : 'enabled'

const toFrontendVisible = (visible?: string): boolean =>
  visible === 'show' || visible === 'true' || visible === '1'

const toBackendVisible = (visible?: boolean): 'show' | 'hide' =>
  visible === false ? 'hide' : 'show'

function mapMenuFromApi(menu: MenuApiModel): Menu {
  return {
    id: menu.id,
    parentId: menu.parentId,
    type: menu.type,
    name: menu.name,
    code: menu.code,
    path: menu.path,
    icon: menu.icon,
    sort: menu.sort ?? 0,
    visible: toFrontendVisible(menu.visible),
    children: menu.children?.map(mapMenuFromApi),
  }
}

function mapMenuToApi(data: Partial<MenuFormData>) {
  return {
    parentId: data.parentId ?? null,
    type: data.type,
    name: data.name,
    code: data.code,
    path: data.path,
    icon: data.icon,
    sort: data.sort ?? 0,
    visible: toBackendVisible(data.visible),
    status: toBackendStatus('active'),
  }
}

export const menuApi = {
  getMenuList: async (): Promise<Menu[]> => {
    const data = await http.get<MenuApiModel[]>('/system/menus/tree')
    return data.map(mapMenuFromApi)
  },

  getMenuDetail: async (id: string): Promise<Menu | null> => {
    const data = await http.get<MenuApiModel>(`/system/menus/${id}`)
    return mapMenuFromApi(data)
  },

  createMenu: async (data: MenuFormData): Promise<{ id: string }> => {
    return http.post<{ id: string }>('/system/menus', mapMenuToApi(data))
  },

  updateMenu: async (id: string, data: Partial<MenuFormData>): Promise<void> => {
    await http.put<void>(`/system/menus/${id}`, mapMenuToApi(data))
  },

  deleteMenu: async (id: string): Promise<void> => {
    await http.delete<void>(`/system/menus/${id}`)
  },

  reorderMenus: async (parentId: string | null, sortedIds: string[]): Promise<void> => {
    await http.post<void>('/system/menus/reorder', {
      parentId,
      orderedIds: sortedIds,
    })
  },
}
