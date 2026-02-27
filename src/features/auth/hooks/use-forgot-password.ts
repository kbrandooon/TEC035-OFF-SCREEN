import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { resetPasswordForEmail } from '../api/reset-password-for-email'
import { updateUser } from '../api/update-user'
import { verifyOtp } from '../api/verify-otp'
import { translateAuthError } from '../utils/error-parser'

type ResetStep = 'email' | 'token' | 'password'

export function useForgotPassword() {
  const [step, setStep] = useState<ResetStep>('email')

  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const navigate = useNavigate()

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (!email) throw new Error('Por favor, ingresa tu correo electrónico.')

      await resetPasswordForEmail(email)

      setStep('token')
      toast.success('Código enviado', {
        description: 'Revisa tu bandeja de entrada o spam.',
      })
    } catch (err) {
      setError(translateAuthError(err))
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyToken = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (!token) throw new Error('Ingresa el código que recibiste.')

      const data = await verifyOtp({
        email,
        token,
        type: 'recovery',
      })
      if (!data.session)
        throw new Error('No se pudo establecer la sesión. Intenta nuevamente.')

      setStep('password')
      toast.success('Código verificado', {
        description: 'Ahora ingresa tu nueva contraseña.',
      })
    } catch (err) {
      setError(translateAuthError(err))
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (newPassword !== confirmPassword) {
        throw new Error('Las contraseñas no coinciden.')
      }
      if (newPassword.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres.')
      }

      await updateUser({
        password: newPassword,
      })

      toast.success('¡Contraseña actualizada!', {
        description:
          'Tu contraseña ha sido cambiada con éxito. Ya puedes iniciar sesión.',
      })
      navigate({ to: '/' })
    } catch (err) {
      setError(translateAuthError(err))
    } finally {
      setIsLoading(false)
    }
  }

  return {
    step,
    email,
    setEmail,
    token,
    setToken,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    isLoading,
    error,
    handleRequestToken,
    handleVerifyToken,
    handleUpdatePassword,
  }
}
