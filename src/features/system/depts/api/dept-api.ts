import { http } from '@/lib/http-client'
import { type Dept, type DeptFormData } from '../data/schema'

interface DeptApiModel {
  id: string
  parentId: string | null
  name: string
  code: string
  sort: number
  status: string
  children?: DeptApiModel[]
}

const toFrontendStatus = (status?: string): 'active' | 'inactive' =>
  status === 'enabled' || status === 'active' ? 'active' : 'inactive'

const toBackendStatus = (status?: 'active' | 'inactive'): 'enabled' | 'disabled' =>
  status === 'inactive' ? 'disabled' : 'enabled'

function mapFromApi(item: DeptApiModel): Dept {
  return {
    id: item.id,
    parentId: item.parentId,
    name: item.name,
    code: item.code,
    sort: item.sort ?? 0,
    status: toFrontendStatus(item.status),
    children: item.children?.map(mapFromApi),
  }
}

function mapToApi(data: Partial<DeptFormData>) {
  return {
    parentId: data.parentId ?? null,
    name: data.name,
    code: data.code,
    sort: data.sort ?? 0,
    status: toBackendStatus(data.status),
  }
}

export const deptApi = {
  getDeptTree: async (): Promise<Dept[]> => {
    const data = await http.get<DeptApiModel[]>('/system/departments/tree')
    return data.map(mapFromApi)
  },

  createDept: async (data: DeptFormData): Promise<{ id: string }> => {
    return http.post<{ id: string }>('/system/departments', mapToApi(data))
  },

  updateDept: async (id: string, data: Partial<DeptFormData>): Promise<void> => {
    await http.put<void>(`/system/departments/${id}`, mapToApi(data))
  },

  deleteDept: async (id: string): Promise<void> => {
    await http.delete<void>(`/system/departments/${id}`)
  },

  reorderDepts: async (parentId: string | null, orderedIds: string[]): Promise<void> => {
    await http.post<void>('/system/departments/reorder', { parentId, orderedIds })
  },

  updateDeptStatus: async (id: string, status: 'active' | 'inactive'): Promise<void> => {
    await http.patch<void>(`/system/departments/${id}/status`, {
      status: toBackendStatus(status),
    })
  },
}
