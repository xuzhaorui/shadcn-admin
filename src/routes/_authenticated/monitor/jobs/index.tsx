import { createFileRoute } from '@tanstack/react-router'
import { Jobs } from '@/features/monitor/jobs'

export const Route = createFileRoute('/_authenticated/monitor/jobs/')({
    component: Jobs,
})
