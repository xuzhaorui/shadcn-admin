import { createFileRoute } from '@tanstack/react-router'
import { Depts } from '@/features/system/depts'

export const Route = createFileRoute('/_authenticated/system/depts/')({
    component: Depts,
})
