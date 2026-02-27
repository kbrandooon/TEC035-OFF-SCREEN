import { useState, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { useLogin } from '../hooks/use-login'

const CAROUSEL_IMAGES = [
  '/images/LOGIN/1.jpeg',
  '/images/LOGIN/2.jpeg',
  '/images/LOGIN/3.jpeg',
  '/images/LOGIN/4.jpeg',
  '/images/LOGIN/5.jpeg',
]

/**
 * LoginPage Component
 *
 * Renders the initial authentication view for the OFF SCREEN admin panel.
 * Follows the provided visual design, utilizing Tailwind CSS for styling.
 *
 * @returns {React.ReactElement} The login page UI
 */
export function LoginPage() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showPassword, setShowPassword] = useState(false)

  const {
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    error,
    handleLogin,
    handleGoogleLogin,
  } = useLogin()

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % CAROUSEL_IMAGES.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className='bg-surface-light font-display flex min-h-screen items-center justify-center overflow-hidden text-slate-800'>
      <div className='flex h-screen w-full'>
        {/* Left Side: Branding / Imagery */}
        <div className='relative hidden h-full w-1/2 overflow-hidden bg-slate-900 lg:block'>
          {CAROUSEL_IMAGES.map((img, idx) => (
            <div
              key={img}
              className={`absolute inset-0 bg-cover bg-center transition-opacity ease-in-out ${
                idx === currentImageIndex ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                backgroundImage: `url('${img}')`,
                transitionDuration: '2000ms',
              }}
            />
          ))}
          <div className='pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-black/20 to-transparent' />

          <div className='absolute bottom-12 left-12 z-20 max-w-md text-white'>
            <div className='mb-6 flex items-center gap-3'>
              <div className='rounded-lg border border-white/20 bg-white/10 p-2 backdrop-blur-md'>
                <span className='material-symbols-outlined text-3xl'>
                  equalizer
                </span>
              </div>
            </div>
            <h2 className='mb-4 text-4xl leading-tight font-bold tracking-tight'>
              Gestión Profesional Audiovisual
            </h2>
            <p className='text-lg leading-relaxed font-light text-slate-300'>
              Optimiza tus reservas de estudio, inventario y relaciones con
              clientes con precisión y elegancia.
            </p>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className='relative flex h-full w-full flex-col items-center justify-center bg-white p-8 lg:w-1/2 lg:p-16 xl:p-24'>
          <div className='mx-auto w-full max-w-md space-y-10'>
            <div className='space-y-2 text-center'>
              <div className='mx-auto mb-6 flex size-12 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg'>
                <span className='material-symbols-outlined text-2xl'>
                  grid_view
                </span>
              </div>
              <h1 className='text-3xl font-bold tracking-tight text-slate-900'>
                Bienvenido
              </h1>
              <p className='text-sm font-medium text-slate-500'>
                Por favor ingresa tus credenciales para acceder.
              </p>
            </div>

            <form className='space-y-6' onSubmit={handleLogin}>
              <div className='space-y-5'>
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

                <div className='space-y-1.5'>
                  <div className='flex items-center justify-between'>
                    <label
                      className='block text-sm font-semibold text-slate-700'
                      htmlFor='password'
                    >
                      Contraseña
                    </label>
                    <Link
                      to='/forgot-password'
                      className='text-primary hover:text-primary-hover rounded-sm text-sm font-bold transition-colors focus:ring-2 focus:ring-slate-500 focus:outline-none'
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                  <div className='relative'>
                    <span className='material-symbols-outlined absolute top-1/2 left-3 -translate-y-1/2 text-[20px] text-slate-400'>
                      lock
                    </span>
                    <input
                      autoComplete='current-password'
                      className='block w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pr-10 pl-10 text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-slate-500 focus:bg-white focus:ring-2 focus:ring-slate-500 focus:outline-none disabled:opacity-50 sm:text-sm'
                      id='password'
                      name='password'
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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
              </div>

              {error && (
                <div className='rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600'>
                  {error}
                </div>
              )}

              <button
                className='group bg-primary hover:bg-primary-hover relative flex w-full justify-center rounded-lg px-4 py-3 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:outline-none active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70'
                type='submit'
                disabled={isLoading}
              >
                {isLoading ? 'Cargando...' : 'Iniciar Sesión'}
                {!isLoading && (
                  <span className='material-symbols-outlined absolute top-1/2 right-4 -translate-y-1/2 text-[20px] text-slate-400 transition-colors group-hover:text-white'>
                    arrow_forward
                  </span>
                )}
              </button>
            </form>

            <div className='relative'>
              <div
                aria-hidden='true'
                className='absolute inset-0 flex items-center'
              >
                <div className='w-full border-t border-slate-200' />
              </div>
              <div className='relative flex justify-center'>
                <span className='bg-white px-3 text-xs font-medium tracking-wider text-slate-400 uppercase'>
                  O continuar con
                </span>
              </div>
            </div>

            <div className='flex flex-col items-center justify-center gap-4'>
              <button
                className='flex w-full max-w-[280px] items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white px-8 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:bg-slate-50 focus:ring-2 focus:ring-slate-200 focus:ring-offset-1 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'
                type='button'
                onClick={handleGoogleLogin}
                disabled={isLoading}
              >
                <svg aria-hidden='true' className='h-5 w-5' viewBox='0 0 24 24'>
                  <path
                    d='M12.0003 20.45C16.667 20.45 20.5836 17.2833 20.5836 12.0003V11.5836H12.0003V14.8003H16.8503C16.6336 15.9003 15.3503 17.6336 12.0003 17.6336C9.21696 17.6336 6.96696 15.367 6.96696 12.5836C6.96696 9.80033 9.21696 7.53366 12.0003 7.53366C13.5836 7.53366 14.6336 8.21699 15.2336 8.80033L17.4836 6.55033C16.0336 5.20033 14.167 4.36699 12.0003 4.36699C7.78363 4.36699 4.36696 7.78366 4.36696 12.0003C4.36696 16.217 7.78363 19.6337 12.0003 19.6337'
                    fill='#1F2937'
                    fillRule='evenodd'
                  />
                </svg>
                <span>Acceder con Google</span>
              </button>
            </div>

            <p className='mt-8 text-center text-sm font-medium text-slate-500'>
              ¿No tienes una cuenta en tu estudio?{' '}
              <Link
                to='/signup'
                className='text-primary hover:text-primary-hover font-bold transition-colors'
              >
                Crear una cuenta
              </Link>
            </p>

            <p className='mt-4 text-center text-xs text-slate-400'>
              © 2026 OFF SCREEN. <br />
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
