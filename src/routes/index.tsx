import { useEffect, useRef } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { LoginPage, useAuth } from '@/features/auth'

export const Route = createFileRoute('/')({
  component: PublicOnlyRoute,
})

function PublicOnlyRoute() {
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()
  const toastIdRef = useRef<string | number | null>(null)

  useEffect(() => {
    const hash = window.location.hash
    if (
      hash &&
      hash.includes('access_token') &&
      isLoading &&
      !toastIdRef.current
    ) {
      toastIdRef.current = toast.loading('Verificando sesión...')
    }
  }, [isLoading])

  useEffect(() => {
    if (!isLoading) {
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current)
        toastIdRef.current = null
      }
      if (user) {
        navigate({ to: '/dashboard', replace: true })
      }
    }
  }, [user, isLoading, navigate])

  if (isLoading) {
    const isOAuthRedirect =
      typeof window !== 'undefined' &&
      window.location.hash.includes('access_token')

    if (isOAuthRedirect) {
      return <LoginPage />
    }
    return null
  }

  if (user) {
    return null
  }

  return <LoginPage />
}
