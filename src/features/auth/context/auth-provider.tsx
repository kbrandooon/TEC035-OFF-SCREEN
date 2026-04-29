import { useEffect, useState } from 'react'
import { getSession } from '../api/get-session'
import { onAuthStateChange } from '../api/on-auth-state-change'
import type { Session, User } from '../types'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasAuthError, setHasAuthError] = useState(false)

  useEffect(() => {
    let mounted = true

    async function initializeAuth() {
      try {
        const currentSession = await getSession()
        if (mounted) {
          setSession(currentSession)
          setUser(currentSession?.user ?? null)
        }
      } catch (_error) {
        if (mounted) setHasAuthError(true)
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    initializeAuth()

    const {
      data: { subscription },
    } = onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  if (hasAuthError) {
    return (
      <div className='flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-8 text-center dark:bg-slate-900'>
        <p className='text-base font-semibold text-slate-700 dark:text-slate-300'>
          No se pudo iniciar la sesión. Por favor recarga la página.
        </p>
        <button
          onClick={() => window.location.reload()}
          className='rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600'
        >
          Recargar
        </button>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ session, user, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}
