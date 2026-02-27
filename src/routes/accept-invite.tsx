import { useEffect, useState } from 'react'
import { z } from 'zod'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { supabase } from '@/supabase/client'
import { getInvitationByToken, acceptInvitation } from '@/features/team'

const searchSchema = z.object({
  token: z.string().uuid(),
})

export const Route = createFileRoute('/accept-invite')({
  validateSearch: searchSchema,
  component: AcceptInvitePage,
})

interface InvitationInfo {
  email: string
  role_name: string
  tenant_name: string
  is_valid: boolean
}

/**
 * Public page for accepting an employee invitation.
 *
 * The user arrives here already authenticated via Supabase's invite magic-link.
 * They must only fill in their personal data and set a password.
 * On submit, `acceptInvitation` RPC links them to the tenant, then
 * `supabase.auth.updateUser` persists the chosen password.
 */
function AcceptInvitePage() {
  const { token } = Route.useSearch()
  const navigate = useNavigate()

  const [invitation, setInvitation] = useState<InvitationInfo | null>(null)
  const [isLoadingInvite, setIsLoadingInvite] = useState(true)
  const [inviteError, setInviteError] = useState<string | null>(null)

  // Form fields
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isDone, setIsDone] = useState(false)

  // Wait for Supabase to process the hash (magic-link session) and then load invite
  useEffect(() => {
    async function init() {
      // supabase-js v2 processes the URL hash automatically on creation.
      // onAuthStateChange fires when the session is ready.
      const { data: listener } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
            if (session) {
              listener.subscription.unsubscribe()

              // Now load the invitation details
              try {
                const data = await getInvitationByToken(token)
                if (!data) {
                  setInviteError('Invitación no encontrada.')
                } else if (!data.is_valid) {
                  setInviteError(
                    'Esta invitación ha expirado o ya fue utilizada.'
                  )
                } else {
                  setInvitation(data as InvitationInfo)
                }
              } catch {
                setInviteError('Error al cargar la invitación.')
              } finally {
                setIsLoadingInvite(false)
              }
            } else {
              setInviteError(
                'No se pudo verificar tu sesión. El link puede haber expirado. Pide una nueva invitación.'
              )
              setIsLoadingInvite(false)
            }
          }
        }
      )

      return () => listener.subscription.unsubscribe()
    }

    void init()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    if (password !== confirmPassword) {
      setSubmitError('Las contraseñas no coinciden.')
      return
    }
    if (password.length < 8) {
      setSubmitError('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    setIsSubmitting(true)
    try {
      // 1. Accept the invitation (links user to tenant + creates profile + updates app_metadata in DB)
      await acceptInvitation(token, firstName, lastName, phone)

      // 2. Set the user's password (they arrived via passwordless magic link)
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      })
      if (updateError) throw new Error(updateError.message)

      // 3. Refresh the session so the JWT picks up the new tenant_id and role
      //    that acceptInvitation wrote to raw_app_meta_data in the DB.
      //    Without this the dashboard sees no tenant_id and shows "Cargando...".
      await supabase.auth.refreshSession()

      setIsDone(true)
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Error al completar el registro.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Loading session or invitation ──────────────────────────────────────────
  if (isLoadingInvite) {
    return (
      <div className='flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50'>
        <span className='material-symbols-outlined animate-spin text-[48px] font-normal text-slate-400'>
          progress_activity
        </span>
        <p className='text-sm font-medium text-slate-500'>
          Verificando invitación...
        </p>
      </div>
    )
  }

  // ── Invalid / error state ──────────────────────────────────────────────────
  if (inviteError) {
    return (
      <div className='flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center'>
        <div className='flex size-16 items-center justify-center rounded-2xl bg-red-100 text-red-600'>
          <span className='material-symbols-outlined text-3xl font-normal'>
            link_off
          </span>
        </div>
        <h1 className='mt-6 text-2xl font-bold text-slate-900'>
          Enlace inválido
        </h1>
        <p className='mt-2 max-w-sm text-slate-500'>{inviteError}</p>
        <button
          onClick={() => void navigate({ to: '/' })}
          className='mt-8 rounded-lg bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow'
        >
          Ir al inicio
        </button>
      </div>
    )
  }

  // ── Success ────────────────────────────────────────────────────────────────
  if (isDone) {
    return (
      <div className='flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center'>
        <div className='flex size-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600'>
          <span className='material-symbols-outlined text-3xl font-normal'>
            check_circle
          </span>
        </div>
        <h1 className='mt-6 text-2xl font-bold text-slate-900'>
          ¡Bienvenido a {invitation?.tenant_name}!
        </h1>
        <p className='mt-2 text-slate-500'>
          Tu cuenta fue configurada correctamente. Ya puedes iniciar sesión.
        </p>
        <button
          onClick={() => void navigate({ to: '/' })}
          className='mt-8 rounded-lg bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow'
        >
          Iniciar Sesión
        </button>
      </div>
    )
  }

  // ── Registration form ──────────────────────────────────────────────────────
  return (
    <div className='font-display flex min-h-screen flex-col justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8'>
      <div className='sm:mx-auto sm:w-full sm:max-w-md'>
        {/* Header */}
        <div className='mb-8 text-center'>
          <div className='mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-xl'>
            <span className='material-symbols-outlined text-2xl font-normal'>
              person_add
            </span>
          </div>
          <h1 className='text-2xl font-extrabold text-slate-900'>
            Únete a{' '}
            <span className='text-slate-700'>{invitation?.tenant_name}</span>
          </h1>
          <p className='mt-1 text-sm text-slate-500'>
            Completa tu perfil para comenzar como{' '}
            <span className='font-semibold capitalize'>
              {(
                {
                  admin: 'Administrador',
                  manager: 'Manager',
                  employee: 'Empleado',
                } as Record<string, string>
              )[invitation?.role_name ?? ''] ?? invitation?.role_name}
            </span>
          </p>
          <p className='mt-3 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600'>
            {invitation?.email}
          </p>
        </div>

        {/* Card */}
        <div className='rounded-2xl border border-slate-200 bg-white px-8 py-8 shadow-xl'>
          <form className='space-y-5' onSubmit={(e) => void handleSubmit(e)}>
            {/* Name fields */}
            <div className='grid grid-cols-2 gap-3'>
              <div>
                <label
                  htmlFor='accept-first'
                  className='mb-1.5 block text-sm font-semibold text-slate-700'
                >
                  Nombre
                </label>
                <input
                  id='accept-first'
                  type='text'
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={isSubmitting}
                  className='block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm placeholder-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-none disabled:opacity-60'
                  placeholder='Juan'
                />
              </div>
              <div>
                <label
                  htmlFor='accept-last'
                  className='mb-1.5 block text-sm font-semibold text-slate-700'
                >
                  Apellido
                </label>
                <input
                  id='accept-last'
                  type='text'
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={isSubmitting}
                  className='block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm placeholder-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-none disabled:opacity-60'
                  placeholder='Ortega'
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label
                htmlFor='accept-phone'
                className='mb-1.5 block text-sm font-semibold text-slate-700'
              >
                Teléfono{' '}
                <span className='font-normal text-slate-400'>(opcional)</span>
              </label>
              <input
                id='accept-phone'
                type='tel'
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isSubmitting}
                className='block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm placeholder-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-none disabled:opacity-60'
                placeholder='+52 55 1234 5678'
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor='accept-password'
                className='mb-1.5 block text-sm font-semibold text-slate-700'
              >
                Contraseña
              </label>
              <div className='relative'>
                <input
                  id='accept-password'
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  className='block w-full rounded-lg border border-slate-300 px-3 py-2.5 pr-10 text-sm placeholder-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-none disabled:opacity-60'
                  placeholder='Mínimo 8 caracteres'
                />
                <button
                  type='button'
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className='absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600'
                >
                  <span className='material-symbols-outlined text-[18px] font-normal'>
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label
                htmlFor='accept-confirm'
                className='mb-1.5 block text-sm font-semibold text-slate-700'
              >
                Confirmar Contraseña
              </label>
              <div className='relative'>
                <input
                  id='accept-confirm'
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isSubmitting}
                  className='block w-full rounded-lg border border-slate-300 px-3 py-2.5 pr-10 text-sm placeholder-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-none disabled:opacity-60'
                  placeholder='Repite tu contraseña'
                />
                <button
                  type='button'
                  tabIndex={-1}
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className='absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600'
                >
                  <span className='material-symbols-outlined text-[18px] font-normal'>
                    {showConfirmPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {submitError && (
              <div className='rounded-lg border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-600'>
                {submitError}
              </div>
            )}

            <button
              type='submit'
              disabled={
                isSubmitting ||
                !firstName.trim() ||
                !lastName.trim() ||
                !password
              }
              className='bg-primary hover:bg-primary-hover flex w-full justify-center rounded-lg px-4 py-3 text-sm font-bold text-white shadow transition-colors disabled:opacity-60'
            >
              {isSubmitting ? 'Guardando...' : 'Confirmar y Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
