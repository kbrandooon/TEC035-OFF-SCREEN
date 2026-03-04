import { useEffect, useRef, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import {
  LoginPage,
  useAuth,
  updateUser,
  ClientProfileModal,
  type SignupRole,
} from '@/features/auth'
import { PENDING_ROLE_KEY } from '@/features/auth/api/sign-in-with-google'

export const Route = createFileRoute('/')({
  component: PublicOnlyRoute,
})

function PublicOnlyRoute() {
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()
  const toastIdRef = useRef<string | number | null>(null)
  const [showClientModal, setShowClientModal] = useState(false)
  const [clientEmail, setClientEmail] = useState('')

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
        const pendingRole = sessionStorage.getItem(
          PENDING_ROLE_KEY
        ) as SignupRole | null

        if (pendingRole) {
          // Consume the stored role immediately so it's not re-applied on refresh
          sessionStorage.removeItem(PENDING_ROLE_KEY)

          // Stamp the role on user_metadata and branch the flow
          updateUser({ data: { role: pendingRole } })
            .then(() => {
              if (pendingRole === 'cliente') {
                setClientEmail(user.email ?? '')
                setShowClientModal(true)
              } else {
                navigate({ to: '/dashboard', replace: true })
              }
            })
            .catch(() => {
              // Even if updateUser fails, let the user through
              navigate({ to: '/dashboard', replace: true })
            })
        } else {
          navigate({ to: '/dashboard', replace: true })
        }
      }
    }
  }, [user, isLoading, navigate])

  if (showClientModal) {
    return (
      <>
        <LoginPage />
        <ClientProfileModal email={clientEmail} />
      </>
    )
  }

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
