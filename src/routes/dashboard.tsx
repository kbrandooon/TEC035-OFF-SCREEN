import { useEffect, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { supabase } from '@/supabase/client'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { signOut, useAuth } from '@/features/auth'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const navigate = useNavigate()
  const { session, user, isLoading } = useAuth()

  // Onboarding Setup State
  const [studioName, setStudioName] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [isCreatingTenant, setIsCreatingTenant] = useState(false)
  const [onboardError, setOnboardError] = useState<string | null>(null)

  useEffect(() => {
    // Redirect to login if auth has resolved and there is no user
    if (!isLoading && !user) {
      void navigate({ to: '/' })
    }
  }, [isLoading, user, navigate])

  const handleSignOut = async () => {
    await signOut()
    navigate({ to: '/' })
  }

  const handleCreateStudio = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreatingTenant(true)
    setOnboardError(null)

    try {
      // Execute the Database RPC to create the tenant and profile securely
      const { error } = await supabase.rpc('create_new_tenant_with_admin', {
        p_tenant_name: studioName,
        p_first_name: firstName,
        p_last_name: lastName,
      })

      if (error) {
        throw new Error(error.message)
      }

      // Force session refresh so the JWT token fetches the shiny new tenant_id claim
      await supabase.auth.refreshSession()

      // Reload page guarantees all queries run with fresh tokens
      window.location.reload()
    } catch (err) {
      setOnboardError(
        err instanceof Error ? err.message : 'Error al crear tu estudio.'
      )
      setIsCreatingTenant(false)
    }
  }

  // Helper to safely read JWT claims since Supabase types don't include our custom ones natively
  const jwtClaims = session?.user?.app_metadata || {}

  if (isLoading || !user) return null

  // --- ONBOARDING VIEW (Fantom / Zero-Tenant Users) ---
  if (!jwtClaims.tenant_id) {
    return (
      <div className='font-display flex min-h-screen flex-col justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8'>
        <div className='sm:mx-auto sm:w-full sm:max-w-md'>
          <div className='mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-xl'>
            <span className='material-symbols-outlined text-3xl'>
              rocket_launch
            </span>
          </div>
          <h2 className='text-center text-3xl font-extrabold text-slate-900'>
            Crea tu Estudio
          </h2>
          <p className='mt-2 text-center text-sm text-slate-600'>
            Vemos que eres nuevo. Configura los detalles de tu compañía para
            comenzar.
          </p>
        </div>

        <div className='mt-8 sm:mx-auto sm:w-full sm:max-w-md'>
          <div className='border border-slate-200 bg-white px-4 py-8 shadow-xl sm:rounded-2xl sm:px-10'>
            <form className='space-y-6' onSubmit={handleCreateStudio}>
              <div>
                <label
                  htmlFor='studioName'
                  className='block text-sm font-semibold text-slate-700'
                >
                  Nombre del Estudio (Compañía)
                </label>
                <div className='mt-1'>
                  <input
                    id='studioName'
                    name='studioName'
                    type='text'
                    required
                    value={studioName}
                    onChange={(e) => setStudioName(e.target.value)}
                    className='block w-full appearance-none rounded-lg border border-slate-300 px-3 py-3 placeholder-slate-400 shadow-sm focus:border-slate-500 focus:ring-slate-500 focus:outline-none sm:text-sm'
                    placeholder='Ej. Cinematik Rentals'
                    disabled={isCreatingTenant}
                  />
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label
                    htmlFor='firstName'
                    className='block text-sm font-semibold text-slate-700'
                  >
                    Nombre
                  </label>
                  <div className='mt-1'>
                    <input
                      id='firstName'
                      name='firstName'
                      type='text'
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className='block w-full appearance-none rounded-lg border border-slate-300 px-3 py-3 placeholder-slate-400 shadow-sm focus:border-slate-500 focus:ring-slate-500 focus:outline-none sm:text-sm'
                      placeholder='John'
                      disabled={isCreatingTenant}
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor='lastName'
                    className='block text-sm font-semibold text-slate-700'
                  >
                    Apellido
                  </label>
                  <div className='mt-1'>
                    <input
                      id='lastName'
                      name='lastName'
                      type='text'
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className='block w-full appearance-none rounded-lg border border-slate-300 px-3 py-3 placeholder-slate-400 shadow-sm focus:border-slate-500 focus:ring-slate-500 focus:outline-none sm:text-sm'
                      placeholder='Doe'
                      disabled={isCreatingTenant}
                    />
                  </div>
                </div>
              </div>

              {onboardError && (
                <div className='rounded-lg border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-600'>
                  {onboardError}
                </div>
              )}

              <div className='pt-2'>
                <button
                  type='submit'
                  disabled={isCreatingTenant}
                  className='bg-primary hover:bg-primary-hover flex w-full justify-center rounded-lg border border-transparent px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:outline-none disabled:opacity-70'
                >
                  {isCreatingTenant
                    ? 'Configurando todo...'
                    : 'Comenzar a usar Off Screen'}
                </button>
                <button
                  type='button'
                  onClick={handleSignOut}
                  className='mt-3 flex w-full justify-center px-4 py-3 text-sm font-semibold text-slate-600 transition-colors hover:text-slate-800'
                >
                  Cerrar Sesión
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // --- STANDARD DASHBOARD VIEW ---
  return (
    <DashboardLayout>
      <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
        <div>
          <h3 className='text-2xl font-bold tracking-tight text-slate-800 dark:text-white'>
            Horario del Estudio
          </h3>
          <p className='mt-1 text-sm text-slate-500 dark:text-slate-400'>
            Gestiona la disponibilidad del estudio y reservas de equipo.
          </p>
        </div>
        <button className='bg-primary hover:bg-primary-hover flex items-center gap-2 rounded-lg border border-transparent px-5 py-2.5 font-medium text-white shadow transition-all hover:shadow-md active:scale-[0.98]'>
          <span className='material-symbols-outlined text-[20px] font-normal'>
            add
          </span>
          Nueva Reserva
        </button>
      </div>
      <div className='flex flex-col gap-6 xl:flex-row'>
        <div className='bg-surface-light dark:bg-surface-dark flex flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 shadow-sm dark:border-slate-700'>
          <div className='flex items-center justify-between border-b border-slate-200 p-6 dark:border-slate-700'>
            <div className='flex items-center gap-4'>
              <h4 className='text-lg font-bold text-slate-800 dark:text-white'>
                Octubre 2026
              </h4>
              <div className='flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 dark:border-slate-700 dark:bg-slate-800/50'>
                <button className='rounded-md px-2 py-1 text-slate-600 transition-colors hover:bg-white hover:shadow-sm dark:text-slate-300 dark:hover:bg-slate-600'>
                  <span className='material-symbols-outlined text-[18px] font-normal'>
                    chevron_left
                  </span>
                </button>
                <button className='rounded-md px-2 py-1 text-slate-600 transition-colors hover:bg-white hover:shadow-sm dark:text-slate-300 dark:hover:bg-slate-600'>
                  <span className='material-symbols-outlined text-[18px] font-normal'>
                    chevron_right
                  </span>
                </button>
              </div>
            </div>
            <div className='flex gap-2'>
              <button className='rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'>
                Mes
              </button>
              <button className='bg-primary rounded-lg px-3 py-1.5 text-sm font-medium text-white shadow-sm'>
                Semana
              </button>
              <button className='rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'>
                Día
              </button>
            </div>
          </div>
          <div className='min-h-[500px] flex-1 bg-slate-50/30 p-6 dark:bg-slate-900/10'>
            <div className='mb-4 grid grid-cols-7 gap-4'>
              <div className='text-center text-xs font-bold tracking-wider text-slate-400 uppercase'>
                Dom
              </div>
              <div className='text-center text-xs font-bold tracking-wider text-slate-400 uppercase'>
                Lun
              </div>
              <div className='text-center text-xs font-bold tracking-wider text-slate-400 uppercase'>
                Mar
              </div>
              <div className='text-center text-xs font-bold tracking-wider text-slate-400 uppercase'>
                Mié
              </div>
              <div className='text-center text-xs font-bold tracking-wider text-slate-400 uppercase'>
                Jue
              </div>
              <div className='text-center text-xs font-bold tracking-wider text-slate-400 uppercase'>
                Vie
              </div>
              <div className='text-center text-xs font-bold tracking-wider text-slate-400 uppercase'>
                Sáb
              </div>
            </div>
            <div className='grid h-full grid-cols-7 grid-rows-5 gap-2'>
              <div className='min-h-[100px] rounded-lg border border-transparent bg-slate-50/50 p-2 dark:bg-slate-800/30'>
                <span className='text-sm font-medium text-slate-300 dark:text-slate-600'>
                  29
                </span>
              </div>
              <div className='min-h-[100px] rounded-lg border border-transparent bg-slate-50/50 p-2 dark:bg-slate-800/30'>
                <span className='text-sm font-medium text-slate-300 dark:text-slate-600'>
                  30
                </span>
              </div>
              <div className='group relative min-h-[100px] cursor-pointer rounded-lg border border-slate-200 bg-white p-2 shadow-sm transition-colors hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-500'>
                <span className='group-hover:text-primary text-sm font-medium text-slate-700 dark:text-slate-300 dark:group-hover:text-white'>
                  1
                </span>
              </div>
              <div className='group relative min-h-[100px] cursor-pointer rounded-lg border border-slate-200 bg-white p-2 shadow-sm transition-colors hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-500'>
                <span className='group-hover:text-primary text-sm font-medium text-slate-700 dark:text-slate-300 dark:group-hover:text-white'>
                  2
                </span>
                <div className='mt-2 truncate rounded border border-blue-200 bg-blue-50 p-1.5 text-xs font-medium text-blue-800 dark:border-blue-800/50 dark:bg-blue-900/40 dark:text-blue-200'>
                  Grabación Podcast
                </div>
              </div>
              <div className='group relative min-h-[100px] cursor-pointer rounded-lg border border-slate-200 bg-white p-2 shadow-sm transition-colors hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-500'>
                <span className='group-hover:text-primary text-sm font-medium text-slate-700 dark:text-slate-300 dark:group-hover:text-white'>
                  3
                </span>
              </div>
              <div className='group relative min-h-[100px] cursor-pointer rounded-lg border border-slate-200 bg-white p-2 shadow-sm transition-colors hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-500'>
                <span className='group-hover:text-primary text-sm font-medium text-slate-700 dark:text-slate-300 dark:group-hover:text-white'>
                  4
                </span>
                <div className='mt-2 truncate rounded border border-purple-200 bg-purple-50 p-1.5 text-xs font-medium text-purple-800 dark:border-purple-800/50 dark:bg-purple-900/40 dark:text-purple-200'>
                  Shooting: Marca X
                </div>
              </div>
              <div className='bg-primary/5 border-primary/20 group hover:border-primary dark:bg-primary/20 relative min-h-[100px] cursor-pointer rounded-lg border p-2 shadow-sm transition-colors'>
                <span className='bg-primary flex size-6 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm'>
                  5
                </span>
              </div>
              <div className='group relative min-h-[100px] cursor-pointer rounded-lg border border-slate-200 bg-white p-2 shadow-sm transition-colors hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-500'>
                <span className='group-hover:text-primary text-sm font-medium text-slate-700 dark:text-slate-300 dark:group-hover:text-white'>
                  6
                </span>
              </div>
              <div className='group relative min-h-[100px] cursor-pointer rounded-lg border border-slate-200 bg-white p-2 shadow-sm transition-colors hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-500'>
                <span className='group-hover:text-primary text-sm font-medium text-slate-700 dark:text-slate-300 dark:group-hover:text-white'>
                  7
                </span>
              </div>
              <div className='group relative min-h-[100px] cursor-pointer rounded-lg border border-slate-200 bg-white p-2 shadow-sm transition-colors hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-500'>
                <span className='group-hover:text-primary text-sm font-medium text-slate-700 dark:text-slate-300 dark:group-hover:text-white'>
                  8
                </span>
                <div className='mt-2 truncate rounded border border-emerald-200 bg-emerald-50 p-1.5 text-xs font-medium text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-900/40 dark:text-emerald-200'>
                  Video Musical
                </div>
              </div>
              <div className='group relative min-h-[100px] cursor-pointer rounded-lg border border-slate-200 bg-white p-2 shadow-sm transition-colors hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-500'>
                <span className='group-hover:text-primary text-sm font-medium text-slate-700 dark:text-slate-300 dark:group-hover:text-white'>
                  9
                </span>
              </div>
              <div className='group relative min-h-[100px] cursor-pointer rounded-lg border border-slate-200 bg-white p-2 shadow-sm transition-colors hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-500'>
                <span className='group-hover:text-primary text-sm font-medium text-slate-700 dark:text-slate-300 dark:group-hover:text-white'>
                  10
                </span>
              </div>
              {/* Other blank calendar days up to 31 mapping omitted for brevity, let's just put a generic mapping for the remaining days so it looks populated */}
              {Array.from({ length: 21 }).map((_, i) => (
                <div
                  key={i + 11}
                  className='group relative min-h-[100px] cursor-pointer rounded-lg border border-slate-200 bg-white p-2 shadow-sm transition-colors hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-500'
                >
                  <span className='group-hover:text-primary text-sm font-medium text-slate-700 dark:text-slate-300 dark:group-hover:text-white'>
                    {i + 11}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className='flex w-full flex-col gap-6 xl:w-96'>
          <div className='bg-surface-light dark:bg-surface-dark flex h-full flex-col rounded-xl border border-slate-200 p-6 shadow-sm dark:border-slate-700'>
            <h4 className='mb-4 flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-white'>
              <span className='material-symbols-outlined text-primary font-normal'>
                event_upcoming
              </span>
              Próximas Reservas
            </h4>
            <div className='custom-scrollbar flex flex-col gap-4 overflow-y-auto pr-2'>
              <div className='group flex gap-4 rounded-lg border border-slate-100 bg-slate-50 p-4 transition-all hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/30 dark:hover:border-slate-500'>
                <div className='flex size-14 shrink-0 flex-col items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-600 dark:bg-slate-800'>
                  <span className='text-xs font-bold text-slate-400 uppercase'>
                    Oct
                  </span>
                  <span className='text-xl font-bold text-slate-800 dark:text-white'>
                    05
                  </span>
                </div>
                <div className='flex min-w-0 flex-1 flex-col'>
                  <div className='flex items-start justify-between'>
                    <h5 className='truncate text-sm font-bold text-slate-800 dark:text-white'>
                      Grabación Podcast
                    </h5>
                    <span className='rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 uppercase dark:border-emerald-800/30 dark:bg-emerald-900/30 dark:text-emerald-300'>
                      Confirmada
                    </span>
                  </div>
                  <p className='mt-1 text-xs font-medium text-slate-500 dark:text-slate-400'>
                    10:00 AM - 12:00 PM
                  </p>
                  <div className='mt-2 flex items-center gap-2'>
                    <div
                      className='size-5 rounded-full bg-cover bg-center ring-1 ring-slate-100 dark:ring-slate-700'
                      style={{
                        backgroundImage:
                          'url("https://lh3.googleusercontent.com/aida-public/AB6AXuA9-rSbEXYSGbfs4uityxd8VOOF1kMttw4TACXn5v9rvCequHQOZZMf4xzQjIs6kCiGMJvgXBtyhK988qjVq9-2nVuD2FsW3aUV4htNt6k-AoOD8KXGC5d8ipldKRn2GB0jPAXMGaScvRIQMhslMu8qvJPCbWB7AjT-jD94AAsZy8SmsFAK0wcTw_jLq0Z_xwFW0focGo7u3yBDmNWIgbPbbwXA1Nt3EewZXv01K_w-JVvxhH4-ZI01QwfIZSRA15NuHDqomhq_1Gk")',
                      }}
                    ></div>
                    <span className='truncate text-xs font-medium text-slate-600 dark:text-slate-300'>
                      Cliente: John Doe
                    </span>
                  </div>
                </div>
              </div>

              <div className='group flex gap-4 rounded-lg border border-slate-100 bg-slate-50 p-4 transition-all hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/30 dark:hover:border-slate-500'>
                <div className='flex size-14 shrink-0 flex-col items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-600 dark:bg-slate-800'>
                  <span className='text-xs font-bold text-slate-400 uppercase'>
                    Oct
                  </span>
                  <span className='text-xl font-bold text-slate-800 dark:text-white'>
                    08
                  </span>
                </div>
                <div className='flex min-w-0 flex-1 flex-col'>
                  <div className='flex items-start justify-between'>
                    <h5 className='truncate text-sm font-bold text-slate-800 dark:text-white'>
                      Video Musical
                    </h5>
                    <span className='rounded-full border border-amber-100 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 uppercase dark:border-amber-800/30 dark:bg-amber-900/30 dark:text-amber-300'>
                      Pendiente
                    </span>
                  </div>
                  <p className='mt-1 text-xs font-medium text-slate-500 dark:text-slate-400'>
                    02:00 PM - 06:00 PM
                  </p>
                  <div className='mt-2 flex items-center gap-2'>
                    <div
                      className='size-5 rounded-full bg-cover bg-center ring-1 ring-slate-100 dark:ring-slate-700'
                      style={{
                        backgroundImage:
                          'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAQtpnVpAtmDQsJ_-coMTwHMkLEcCehIrCHEn4QofcCiYSIVVIUbISr4x7-06Kk1c52YcjLrJ2tfOmgLulSN8oF3WR1Y3aBJW8NhRBQ78Qvs9EatUE9uutoDsIhXi7zFKJZnysM-U4DNt2cEDcc3NsBGyoy4kwVG9fntLzjsTZxOY6j4bInnV746HjOa2LXq8JF44FA6aeKWZ5LurRBWqxBibM1DJEDqjld2Ae1r_kGwEknrglSlV-oZTup92MsNrY8tmXDGQrroDA")',
                      }}
                    ></div>
                    <span className='truncate text-xs font-medium text-slate-600 dark:text-slate-300'>
                      Cliente: Sarah Smith
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <button className='mt-4 w-full rounded-lg border border-slate-200 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800'>
              Ver Todas Las Reservas
            </button>
          </div>

          <div className='relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 p-6 text-white shadow-lg ring-1 ring-slate-900/5'>
            <div className='absolute -top-4 -right-4 opacity-5 mix-blend-overlay'>
              <span className='material-symbols-outlined text-[120px] font-normal'>
                videocam
              </span>
            </div>
            <h4 className='relative z-10 mb-1 text-lg font-bold tracking-tight'>
              Status de Inventario
            </h4>
            <p className='relative z-10 mb-5 text-xs font-medium text-slate-400'>
              Disponibilidad en tiempo real
            </p>
            <div className='relative z-10 space-y-4'>
              <div>
                <div className='mb-1.5 flex items-center justify-between text-sm'>
                  <span className='font-medium text-slate-300'>Cámaras</span>
                  <span className='text-xs font-bold text-emerald-400'>
                    8/10 Disponibles
                  </span>
                </div>
                <div className='h-1.5 w-full rounded-full bg-slate-700/50 backdrop-blur-sm'>
                  <div
                    className='h-1.5 rounded-full bg-emerald-500 shadow-sm'
                    style={{ width: '80%' }}
                  ></div>
                </div>
              </div>
              <div>
                <div className='mb-1.5 flex items-center justify-between text-sm'>
                  <span className='font-medium text-slate-300'>
                    Iluminación
                  </span>
                  <span className='text-xs font-bold text-amber-400'>
                    4/12 Disponibles
                  </span>
                </div>
                <div className='h-1.5 w-full rounded-full bg-slate-700/50 backdrop-blur-sm'>
                  <div
                    className='h-1.5 rounded-full bg-amber-500 shadow-sm'
                    style={{ width: '33%' }}
                  ></div>
                </div>
              </div>
              <div>
                <div className='mb-1.5 flex items-center justify-between text-sm'>
                  <span className='font-medium text-slate-300'>Micrófonos</span>
                  <span className='text-xs font-bold text-emerald-400'>
                    15/15 Disponibles
                  </span>
                </div>
                <div className='h-1.5 w-full rounded-full bg-slate-700/50 backdrop-blur-sm'>
                  <div
                    className='h-1.5 rounded-full bg-emerald-500 shadow-sm'
                    style={{ width: '100%' }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
