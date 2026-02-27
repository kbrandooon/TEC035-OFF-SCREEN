import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useForgotPassword } from '../hooks/use-forgot-password'

const BRAND_IMAGE = '/images/LOGIN/1.jpeg'

export function ForgotPasswordPage() {
  const [showPassword, setShowPassword] = useState(false)

  const {
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
  } = useForgotPassword()

  return (
    <div className='bg-surface-light font-display flex min-h-screen items-center justify-center overflow-hidden text-slate-800'>
      <div className='flex h-screen w-full'>
        {/* Left Side: Branding / Imagery */}
        <div className='relative hidden h-full w-1/2 overflow-hidden bg-slate-900 lg:block'>
          <div
            className='absolute inset-0 bg-cover bg-center opacity-100 transition-opacity ease-in-out'
            style={{
              backgroundImage: `url('${BRAND_IMAGE}')`,
            }}
          />
          <div className='pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-black/20 to-transparent' />

          <div className='absolute bottom-12 left-12 z-20 max-w-md text-white'>
            <div className='mb-6 flex items-center gap-3'>
              <div className='rounded-lg border border-white/20 bg-white/10 p-2 backdrop-blur-md'>
                <span className='material-symbols-outlined text-3xl'>
                  lock_reset
                </span>
              </div>
            </div>
            <h2 className='mb-4 text-4xl leading-tight font-bold tracking-tight'>
              Recuperación de Acceso
            </h2>
            <p className='text-lg leading-relaxed font-light text-slate-300'>
              Te enviaremos un código seguro a tu correo para restablecer tu
              contraseña y recuperar el control.
            </p>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className='relative flex h-full w-full flex-col items-center justify-center overflow-y-auto bg-white p-8 lg:w-1/2 lg:p-16 xl:p-24'>
          <div className='mx-auto w-full max-w-md space-y-10'>
            <div className='space-y-2 text-center'>
              <div className='mx-auto mb-6 flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-900 shadow-sm'>
                <span className='material-symbols-outlined text-2xl'>key</span>
              </div>
              <h1 className='text-3xl font-bold tracking-tight text-slate-900'>
                {step === 'email' && '¿Olvidaste tu contraseña?'}
                {step === 'token' && 'Verifica tu Código'}
                {step === 'password' && 'Crea nueva contraseña'}
              </h1>
              <p className='text-sm font-medium text-slate-500'>
                {step === 'email' &&
                  'Ingresa el correo asociado a tu cuenta para enviarte un código numérico.'}
                {step === 'token' &&
                  `Hemos enviado un código a ${email}. Cópialo y pégalo abajo.`}
                {step === 'password' &&
                  'Tu código fue verificado. Ahora, crea tu nueva contraseña.'}
              </p>
            </div>

            {/* STEP 1: EMAIL */}
            {step === 'email' && (
              <form className='space-y-6' onSubmit={handleRequestToken}>
                <div className='space-y-1.5'>
                  <label
                    className='block text-sm font-semibold text-slate-700'
                    htmlFor='email'
                  >
                    Correo Electrónico
                  </label>
                  <div className='relative'>
                    <span className='material-symbols-outlined absolute top-1/2 left-3 -translate-y-1/2 text-[20px] text-slate-400'>
                      mail
                    </span>
                    <input
                      autoComplete='email'
                      className='block w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pr-4 pl-10 text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-slate-500 focus:bg-white focus:ring-2 focus:ring-slate-500 focus:outline-none disabled:opacity-50 sm:text-sm'
                      id='email'
                      name='email'
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder='admin@offscreen.com'
                      required
                      type='email'
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {error && (
                  <div className='rounded-lg border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-600'>
                    {error}
                  </div>
                )}

                <button
                  className='group bg-primary hover:bg-primary-hover relative flex w-full justify-center rounded-lg px-4 py-3 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:outline-none active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70'
                  type='submit'
                  disabled={isLoading}
                >
                  {isLoading ? 'Enviando...' : 'Obtener código de recuperación'}
                  {!isLoading && (
                    <span className='material-symbols-outlined absolute top-1/2 right-4 -translate-y-1/2 text-[20px] text-slate-400 transition-colors group-hover:text-white'>
                      arrow_forward
                    </span>
                  )}
                </button>
              </form>
            )}

            {/* STEP 2: TOKEN */}
            {step === 'token' && (
              <form className='space-y-6' onSubmit={handleVerifyToken}>
                <div className='space-y-1.5'>
                  <label
                    className='block text-sm font-semibold text-slate-700'
                    htmlFor='token'
                  >
                    Código de Seguridad (OTP)
                  </label>
                  <div className='relative'>
                    <span className='material-symbols-outlined absolute top-1/2 left-3 -translate-y-1/2 text-[20px] text-slate-400'>
                      pin
                    </span>
                    <input
                      className='block w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pr-4 pl-10 text-center text-lg font-bold tracking-widest text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-slate-500 focus:bg-white focus:ring-2 focus:ring-slate-500 focus:outline-none disabled:opacity-50'
                      id='token'
                      name='token'
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder='12345678'
                      required
                      type='text'
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {error && (
                  <div className='rounded-lg border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-600'>
                    {error}
                  </div>
                )}

                <button
                  className='group bg-primary hover:bg-primary-hover relative flex w-full justify-center rounded-lg px-4 py-3 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:outline-none active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70'
                  type='submit'
                  disabled={isLoading}
                >
                  {isLoading ? 'Verificando...' : 'Verificar código'}
                </button>
              </form>
            )}

            {/* STEP 3: NEW PASSWORD */}
            {step === 'password' && (
              <form className='space-y-6' onSubmit={handleUpdatePassword}>
                <div className='space-y-5'>
                  <div className='space-y-1.5'>
                    <label
                      className='block text-sm font-semibold text-slate-700'
                      htmlFor='newPassword'
                    >
                      Nueva Contraseña
                    </label>
                    <div className='relative'>
                      <span className='material-symbols-outlined absolute top-1/2 left-3 -translate-y-1/2 text-[20px] text-slate-400'>
                        lock
                      </span>
                      <input
                        className='block w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pr-10 pl-10 text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-slate-500 focus:bg-white focus:ring-2 focus:ring-slate-500 focus:outline-none disabled:opacity-50 sm:text-sm'
                        id='newPassword'
                        name='newPassword'
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder='••••••••'
                        required
                        type={showPassword ? 'text' : 'password'}
                        disabled={isLoading}
                      />
                      <button
                        type='button'
                        onClick={() => setShowPassword(!showPassword)}
                        className='absolute top-1/2 right-3 -translate-y-1/2 text-[20px] text-slate-400 hover:text-slate-600 focus:outline-none disabled:opacity-50'
                        disabled={isLoading}
                      >
                        <span className='material-symbols-outlined'>
                          {showPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className='space-y-1.5'>
                    <label
                      className='block text-sm font-semibold text-slate-700'
                      htmlFor='confirmPassword'
                    >
                      Confirmar Contraseña
                    </label>
                    <div className='relative'>
                      <span className='material-symbols-outlined absolute top-1/2 left-3 -translate-y-1/2 text-[20px] text-slate-400'>
                        lock_reset
                      </span>
                      <input
                        className='block w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pr-10 pl-10 text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-slate-500 focus:bg-white focus:ring-2 focus:ring-slate-500 focus:outline-none disabled:opacity-50 sm:text-sm'
                        id='confirmPassword'
                        name='confirmPassword'
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder='••••••••'
                        type={showPassword ? 'text' : 'password'}
                        disabled={isLoading}
                      />
                      <button
                        type='button'
                        onClick={() => setShowPassword(!showPassword)}
                        className='absolute top-1/2 right-3 -translate-y-1/2 text-[20px] text-slate-400 hover:text-slate-600 focus:outline-none disabled:opacity-50'
                        disabled={isLoading}
                      >
                        <span className='material-symbols-outlined'>
                          {showPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className='rounded-lg border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-600'>
                    {error}
                  </div>
                )}

                <button
                  className='group bg-primary hover:bg-primary-hover relative flex w-full justify-center rounded-lg px-4 py-3 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:outline-none active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70'
                  type='submit'
                  disabled={isLoading}
                >
                  {isLoading ? 'Actualizando...' : 'Actualizar contraseña'}
                </button>
              </form>
            )}

            <p className='mt-8 text-center text-sm font-medium text-slate-500'>
              <Link
                to='/'
                className='text-primary hover:text-primary-hover flex items-center justify-center gap-1 font-bold transition-colors'
              >
                <span className='material-symbols-outlined text-[18px]'>
                  arrow_back
                </span>
                Atrás
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
