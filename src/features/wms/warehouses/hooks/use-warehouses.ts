import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  warehouseApi,
  type WarehouseListParams,
} from '../api/warehouse-api'
import { type WarehouseFormData } from '../data/schema'

const QUERY_KEY = ['wms', 'warehouses'] as const

export function useWarehouses(params: WarehouseListParams) {
  return useQuery({
    queryKey: [...QUERY_KEY, params],
    queryFn: () => warehouseApi.getWarehouseList(params),
    staleTime: 30 * 1000,
  })
}

export function useCreateWarehouse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: WarehouseFormData) => warehouseApi.createWarehouse(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useUpdateWarehouse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: WarehouseFormData }) =>
      warehouseApi.updateWarehouse(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}
