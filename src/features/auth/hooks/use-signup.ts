import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { checkEmailExists } from '../api/check-email-exists'
import { signInWithGoogle } from '../api/sign-in-with-google'
import { signUpWithEmail, type SignupRole } from '../api/sign-up-with-email'
import { translateAuthError } from '../utils/error-parser'

/**
 * Hook for managing the signup form state, role selection,
 * and the post-signup client profile step.
 *
 * @returns Form state, role toggle, profile form visibility, and submission handlers.
 */
export function useSignup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<SignupRole>('cliente')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Controls whether the ClientProfileModal is shown after a 'cliente' signup
  const [showProfileForm, setShowProfileForm] = useState(false)

  const navigate = useNavigate()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      setIsLoading(false)
      return
    }

    try {
      // 1. Verify if the email is already in use natively bypassing RLS
      const emailInUse = await checkEmailExists(email)

      if (emailInUse) {
        throw new Error(
          'Este correo electrónico ya está registrado. Intenta iniciar sesión.'
        )
      }

      // 2. Actually create the account with the chosen role in user_metadata
      await signUpWithEmail(email, password, role)

      if (role === 'cliente') {
        // Stay on page — show the client profile form step
        setShowProfileForm(true)
      } else {
        // Estudio flow: show success toast and go to login
        toast.success('Cuenta creada con éxito', {
          description:
            'Por favor, revisa tu bandeja de entrada para verificar tu correo electrónico.',
        })
        navigate({ to: '/' })
      }
    } catch (err) {
      setError(translateAuthError(err))
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Role is saved to sessionStorage inside signInWithGoogle before the redirect.
      await signInWithGoogle(role)
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
    confirmPassword,
    setConfirmPassword,
    role,
    setRole,
    isLoading,
    error,
    showProfileForm,
    handleSignup,
    handleGoogleSignup,
  }
}
