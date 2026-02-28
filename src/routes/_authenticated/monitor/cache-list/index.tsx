import { Navigate, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/monitor/cache-list/')({
    component: () => <Navigate to='/monitor/cache' replace />,
})
