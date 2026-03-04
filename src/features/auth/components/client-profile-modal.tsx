import { useClientProfile } from '../hooks/use-client-profile'

interface ClientProfileModalProps {
  /** The email the user just registered with — shown as read-only */
  email: string
}

/**
 * Full-screen overlay shown immediately after a 'cliente' signup.
 *
 * Collects first name, last name, and phone number, then calls
 * `save_client_profile` RPC before redirecting to the login page.
 * The email field is pre-filled and locked since it was already registered.
 */
export function ClientProfileModal({ email }: ClientProfileModalProps) {
  const {
    firstName,
    setFirstName,
    lastName,
    setLastName,
    phone,
    setPhone,
    isLoading,
    error,
    handleSubmit,
  } = useClientProfile(email)

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm'>
      <div className='mx-4 w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl'>
        {/* Header */}
        <div className='mb-8 text-center'>
          <div className='mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg'>
            <span className='material-symbols-outlined text-2xl'>
              person_add
            </span>
          </div>
          <h2 className='text-2xl font-bold tracking-tight text-slate-900'>
            Completa tu perfil
          </h2>
          <p className='mt-1 text-sm text-slate-500'>
            Solo unos datos más para terminar tu registro.
          </p>
        </div>

        <form onSubmit={handleSubmit} className='space-y-5'>
          {/* Email read-only */}
          <div className='space-y-1.5'>
            <label
              className='block text-sm font-semibold text-slate-700'
              htmlFor='cp-email'
            >
              Correo Electrónico
            </label>
            <div className='relative'>
              <span className='material-symbols-outlined absolute top-1/2 left-3 -translate-y-1/2 text-[20px] text-slate-400'>
                mail
              </span>
              <input
                id='cp-email'
                type='email'
                value={email}
                readOnly
                className='block w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 py-3 pr-4 pl-10 text-sm text-slate-500'
              />
            </div>
          </div>

          {/* First name */}
          <div className='space-y-1.5'>
            <label
              className='block text-sm font-semibold text-slate-700'
              htmlFor='cp-first-name'
            >
              Nombres
            </label>
            <div className='relative'>
              <span className='material-symbols-outlined absolute top-1/2 left-3 -translate-y-1/2 text-[20px] text-slate-400'>
                badge
              </span>
              <input
                id='cp-first-name'
                type='text'
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder='Ej. María Fernanda'
                required
                disabled={isLoading}
                className='block w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pr-4 pl-10 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-slate-500 focus:bg-white focus:ring-2 focus:ring-slate-500 focus:outline-none disabled:opacity-50'
              />
            </div>
          </div>

          {/* Last name */}
          <div className='space-y-1.5'>
            <label
              className='block text-sm font-semibold text-slate-700'
              htmlFor='cp-last-name'
            >
              Apellidos
            </label>
            <div className='relative'>
              <span className='material-symbols-outlined absolute top-1/2 left-3 -translate-y-1/2 text-[20px] text-slate-400'>
                badge
              </span>
              <input
                id='cp-last-name'
                type='text'
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder='Ej. López García'
                required
                disabled={isLoading}
                className='block w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pr-4 pl-10 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-slate-500 focus:bg-white focus:ring-2 focus:ring-slate-500 focus:outline-none disabled:opacity-50'
              />
            </div>
          </div>

          {/* Phone */}
          <div className='space-y-1.5'>
            <label
              className='block text-sm font-semibold text-slate-700'
              htmlFor='cp-phone'
            >
              Teléfono{' '}
              <span className='font-normal text-slate-400'>(opcional)</span>
            </label>
            <div className='relative'>
              <span className='material-symbols-outlined absolute top-1/2 left-3 -translate-y-1/2 text-[20px] text-slate-400'>
                phone
              </span>
              <input
                id='cp-phone'
                type='tel'
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder='Ej. +52 55 1234 5678'
                disabled={isLoading}
                className='block w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pr-4 pl-10 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-slate-500 focus:bg-white focus:ring-2 focus:ring-slate-500 focus:outline-none disabled:opacity-50'
              />
            </div>
          </div>

          {error && (
            <div className='rounded-lg border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-600'>
              {error}
            </div>
          )}

          <button
            type='submit'
            disabled={isLoading}
            className='group bg-primary hover:bg-primary-hover relative flex w-full justify-center rounded-lg px-4 py-3 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:outline-none active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70'
          >
            {isLoading ? 'Guardando...' : 'Guardar y continuar'}
            {!isLoading && (
              <span className='material-symbols-outlined absolute top-1/2 right-4 -translate-y-1/2 text-[20px] text-slate-400 transition-colors group-hover:text-white'>
                arrow_forward
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
