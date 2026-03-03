import { createFileRoute } from '@tanstack/react-router'
import { ForgotPasswordPage, useAuth } from '@/features/auth'

export const Route = createFileRoute('/forgot-password')({
  component: PublicOnlyRoute,
})

function PublicOnlyRoute() {
  const { isLoading } = useAuth()

  if (isLoading) {
    return null
  }

  return <ForgotPasswordPage />
}
