import { createFileRoute } from '@tanstack/react-router'
import { TreeDemo } from '@/features/components/tree'

export const Route = createFileRoute('/_authenticated/components/tree/')({
    component: TreeDemo,
})
