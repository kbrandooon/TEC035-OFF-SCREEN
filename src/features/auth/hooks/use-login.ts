import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { signIn } from '../api/sign-in'
import { signInWithGoogle } from '../api/sign-in-with-google'
import { translateAuthError } from '../utils/error-parser'

export function useLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Assuming a router exists, otherwise fallback to vanilla redirection or custom hook
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      await signIn(email, password)
      navigate({ to: '/dashboard' })
    } catch (err) {
      setError(translateAuthError(err))
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError(null)

    try {
      await signInWithGoogle()
      // OAuth redirect handles the navigation.
    } catch (err) {
      setError(translateAuthError(err))
      setIsLoading(false)
    }
  }

  return {
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    error,
    handleLogin,
    handleGoogleLogin,
  }
}
