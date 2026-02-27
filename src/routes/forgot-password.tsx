import { useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ForgotPasswordPage } from '@/features/auth/components/forgot-password-page'
import { useAuth } from '@/features/auth/hooks/use-auth'

export const Route = createFileRoute('/forgot-password')({
  component: PublicOnlyRoute,
})

function PublicOnlyRoute() {
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && user) {
      navigate({ to: '/dashboard', replace: true })
    }
  }, [user, isLoading, navigate])

  if (isLoading || user) {
    return null
  }

  return <ForgotPasswordPage />
}
