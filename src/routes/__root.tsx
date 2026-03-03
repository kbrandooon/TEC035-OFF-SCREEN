import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/features/auth'

/** Shared QueryClient — one instance for the whole app. */
const queryClient = new QueryClient()

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <Toaster position='top-right' richColors />
      </AuthProvider>
    </QueryClientProvider>
  )
}
