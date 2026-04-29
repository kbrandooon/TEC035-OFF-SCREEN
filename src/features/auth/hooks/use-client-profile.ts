import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { saveClientProfile } from '../api/save-client-profile'
import { translateAuthError } from '../utils/error-parser'

/**
 * Hook for managing the post-signup client profile form.
 *
 * Called after a 'cliente' user successfully creates their account.
 * Submits first name, last name, and phone to the `save_client_profile` RPC,
 * then redirects to the login page on success.
 *
 * @param clientEmail - The email already registered, shown read-only in the UI.
 * @returns Form state and submission handler.
 */
export function useClientProfile(clientEmail: string) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      await saveClientProfile(firstName, lastName, phone || undefined)
      navigate({ to: '/' })
    } catch (err) {
      setError(translateAuthError(err))
    } finally {
      setIsLoading(false)
    }
  }

  return {
    firstName,
    setFirstName,
    lastName,
    setLastName,
    phone,
    setPhone,
    isLoading,
    error,
    clientEmail,
    handleSubmit,
  }
}
