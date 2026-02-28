import { createFileRoute } from '@tanstack/react-router'
import { OnlineUsers } from '@/features/monitor/online'

export const Route = createFileRoute('/_authenticated/monitor/online/')({
    component: OnlineUsers,
})
