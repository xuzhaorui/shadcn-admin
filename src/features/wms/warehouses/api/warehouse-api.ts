import { http, type PaginatedResponse } from '@/lib/http-client'
import { type Warehouse, type WarehouseFormData } from '../data/schema'

interface WarehouseApiModel {
  id: string
  name: string
  description?: string | null
  status: string
  createdAt?: string
  updatedAt?: string
}

export interface WarehouseListParams {
  page: number
  pageSize: number
  keyword?: string
  status?: 'active' | 'inactive'
}

const toFrontendStatus = (status?: string): 'active' | 'inactive' =>
  status === 'enabled' || status === 'active' ? 'active' : 'inactive'

const toBackendStatus = (status?: 'active' | 'inactive'): 'enabled' | 'disabled' =>
  status === 'inactive' ? 'disabled' : 'enabled'

const mapWarehouseFromApi = (item: WarehouseApiModel): Warehouse => ({
  id: item.id,
  name: item.name,
  description: item.description,
  status: toFrontendStatus(item.status),
  createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
  updatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined,
})

const mapWarehouseToApi = (payload: Partial<WarehouseFormData>) => ({
  name: payload.name,
  description: payload.description?.trim() || null,
  status: toBackendStatus(payload.status),
})

export const warehouseApi = {
  getWarehouseList: async (params: WarehouseListParams): Promise<PaginatedResponse<Warehouse>> => {
    const page = await http.get<PaginatedResponse<WarehouseApiModel>>('/wms/warehouses/list', {
      params: {
        ...params,
        status: params.status ? toBackendStatus(params.status) : undefined,
      },
    })
    return {
      ...page,
      list: page.list.map(mapWarehouseFromApi),
    }
  },

  getWarehouseDetail: async (id: string): Promise<Warehouse> => {
    const data = await http.get<WarehouseApiModel>(`/wms/warehouses/${id}`)
    return mapWarehouseFromApi(data)
  },

  createWarehouse: async (payload: WarehouseFormData): Promise<string> => {
    const data = await http.post<{ id: string }>('/wms/warehouses', mapWarehouseToApi(payload))
    return data.id
  },

  updateWarehouse: async (id: string, payload: WarehouseFormData): Promise<void> => {
    await http.put<void>(`/wms/warehouses/${id}`, mapWarehouseToApi(payload))
  },
}
