import { createRootRoute, Outlet } from '@tanstack/react-router'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/features/auth'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <AuthProvider>
      <Outlet />
      <Toaster position='top-right' richColors />
    </AuthProvider>
  )
}
