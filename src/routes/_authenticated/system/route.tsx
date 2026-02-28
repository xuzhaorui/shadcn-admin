import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/system')({
  component: SystemLayout,
})

function SystemLayout() {
  return <Outlet />
}
