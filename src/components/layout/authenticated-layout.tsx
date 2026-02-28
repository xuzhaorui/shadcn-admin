import { Navigate, Outlet, useLocation } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { getCookie } from '@/lib/cookies'
import { http } from '@/lib/http-client'
import { menuApi } from '@/features/system/menus/api/menu-api'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'
import { LayoutProvider } from '@/context/layout-provider'
import { SearchProvider } from '@/context/search-provider'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { SkipToMain } from '@/components/skip-to-main'
import { canAccessPathByMenus, getPermissionsFromUser } from '@/lib/permission'

type AuthenticatedLayoutProps = {
  children?: React.ReactNode
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const defaultOpen = getCookie('sidebar_state') !== 'false'
  const pathname = useLocation({ select: (location) => location.pathname })
  const authUser = useAuthStore((state) => state.auth.user)
  const initialized = useAuthStore((state) => state.auth.initialized)
  const setUser = useAuthStore((state) => state.auth.setUser)
  const setInitialized = useAuthStore((state) => state.auth.setInitialized)

  const { data, isError, isFetched } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () =>
      http.get<{
        userId: string
        username: string
        roleNames?: string[]
        permissions?: string[]
      }>('/auth/me'),
    staleTime: 1000 * 60,
    retry: false,
  })

  useEffect(() => {
    if (data) {
      setUser({
        accountNo: data.userId,
        email: data.username,
        role: data.roleNames ?? [],
        permissions: data.permissions ?? [],
        exp: Date.now() + 60 * 60 * 1000,
      })
      setInitialized(true)
      return
    }
    if (isError && isFetched) {
      setUser(null)
      setInitialized(true)
    }
  }, [data, isError, isFetched, setInitialized, setUser])

  const permissions = getPermissionsFromUser(authUser)
  const { data: menuTree, isLoading: menuLoading } = useQuery({
    queryKey: ['menus'],
    queryFn: () => menuApi.getMenuList(),
    staleTime: 1000 * 60 * 5,
    enabled: !!authUser,
  })
  const forbidden = !!authUser && !menuLoading && !canAccessPathByMenus(pathname, menuTree, permissions)

  if (!initialized) {
    return null
  }

  if (!authUser) {
    const redirect = pathname || '/'
    return <Navigate to='/sign-in' search={{ redirect }} replace />
  }

  if (forbidden) {
    return <Navigate to='/' replace />
  }

  return (
    <SearchProvider>
      <LayoutProvider>
        <SidebarProvider defaultOpen={defaultOpen}>
          <SkipToMain />
          <AppSidebar />
          <SidebarInset
            className={cn(
              // Set content container, so we can use container queries
              '@container/content',

              // If layout is fixed, set the height
              // to 100svh to prevent overflow
              'has-data-[layout=fixed]:h-svh',

              // If layout is fixed and sidebar is inset,
              // set the height to 100svh - spacing (total margins) to prevent overflow
              'peer-data-[variant=inset]:has-data-[layout=fixed]:h-[calc(100svh-(var(--spacing)*4))]'
            )}
          >
            {children ?? <Outlet />}
          </SidebarInset>
        </SidebarProvider>
      </LayoutProvider>
    </SearchProvider>
  )
}
