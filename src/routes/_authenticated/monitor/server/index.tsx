import { createFileRoute } from '@tanstack/react-router'
import { ServerMonitor } from '@/features/monitor/server'

export const Route = createFileRoute('/_authenticated/monitor/server/')({
    component: ServerMonitor,
})
