import { createFileRoute } from '@tanstack/react-router'
import { Warehouses } from '@/features/wms/warehouses'

export const Route = createFileRoute('/_authenticated/wms/warehouses/')({
  component: Warehouses,
})
