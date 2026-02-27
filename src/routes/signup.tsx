import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { SignupPage } from '@/features/auth/components/signup-page'

export const Route = createFileRoute('/signup')({
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

  return <SignupPage />
}
