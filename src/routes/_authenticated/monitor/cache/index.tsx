import { createFileRoute } from '@tanstack/react-router'
import { CacheMonitor } from '@/features/monitor/cache'

export const Route = createFileRoute('/_authenticated/monitor/cache/')({
    component: CacheMonitor,
})
