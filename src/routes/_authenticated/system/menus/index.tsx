import { createFileRoute } from '@tanstack/react-router'
import { Menus } from '@/features/system/menus'

export const Route = createFileRoute('/_authenticated/system/menus/')({
    component: Menus,
})
