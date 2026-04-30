import { createFileRoute, useNavigate, Outlet } from '@tanstack/react-router'
import { useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useAuth } from '@/features/auth'

export const Route = createFileRoute('/dashboard')({
  component: DashboardLayoutWrapper,
})

function DashboardLayoutWrapper() {
  const navigate = useNavigate()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && !user) {
      void navigate({ to: '/' })
    }
  }, [isLoading, user, navigate])

  if (isLoading || !user) return null

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  )
}
