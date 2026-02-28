import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/monitor')({
    component: MonitorLayout,
})

function MonitorLayout() {
    return <Outlet />
}
