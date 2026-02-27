import { useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ForgotPasswordPage, useAuth } from '@/features/auth'

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
