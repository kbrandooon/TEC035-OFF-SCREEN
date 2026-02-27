import { type ReactNode, useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { supabase } from '@/supabase/client'
import { signOut, useAuth, useIsAdmin, useRoleLabel } from '@/features/auth'
import { TenantSwitcher } from '@/features/tenants'

/** Props for DashboardLayout */
interface DashboardLayoutProps {
  children: ReactNode
}

/**
 * Layout principal del Dashboard Administrativo de Off Screen.
 *
 * Gestiona la carga del tenant activo, el nombre del perfil del usuario,
 * el sidebar de navegación, el header y el modal de creación de nuevo estudio.
 *
 * @param children - Contenido principal de la página.
 */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  const navigate = useNavigate()
  const { user, session } = useAuth()
  const isAdmin = useIsAdmin()
  const roleLabel = useRoleLabel()

  const [tenantName, setTenantName] = useState<string>('Cargando...')
  const [fullName, setFullName] = useState<string>('Admin')

  // Add Studio modal state
  const [showAddStudio, setShowAddStudio] = useState(false)
  const [configOpen, setConfigOpen] = useState(false)
  const [studioName, setStudioName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchLayoutData() {
      if (!user) return

      const tenantId = session?.user?.app_metadata?.tenant_id as
        | string
        | undefined
      if (!tenantId) return

      const [tenantResult, profileResult] = await Promise.all([
        supabase.from('tenants').select('name').limit(1).maybeSingle(),
        supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', user.id)
          .maybeSingle(),
      ])

      if (tenantResult.data?.name) {
        setTenantName(tenantResult.data.name)
      }

      if (profileResult.data) {
        const { first_name, last_name } = profileResult.data
        const name = [first_name, last_name].filter(Boolean).join(' ')
        setFullName(name || user.email?.split('@')[0] || 'Admin')
      }
    }

    fetchLayoutData()
  }, [user, session])

  const handleSignOut = async () => {
    await signOut()
    navigate({ to: '/' })
  }

  /** Opens the Add Studio modal and resets form state. */
  const handleOpenAddStudio = () => {
    setStudioName('')
    setCreateError(null)
    setShowAddStudio(true)
  }

  /** Submits the new tenant creation form. */
  const handleCreateStudio = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    setCreateError(null)

    try {
      const { error } = await supabase.rpc('create_new_tenant_with_admin', {
        p_tenant_name: studioName,
        p_first_name: '',
        p_last_name: '',
      })

      if (error) throw new Error(error.message)

      await supabase.auth.refreshSession()
      window.location.reload()
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : 'Error al crear el estudio.'
      )
      setIsCreating(false)
    }
  }

  // Logo shared between brand header and TenantSwitcher
  const logoEl = (
    <div
      className='size-10 shrink-0 rounded-full bg-cover bg-center bg-no-repeat shadow-sm ring-1 ring-slate-200 brightness-110 contrast-125 grayscale dark:ring-slate-600'
      style={{
        backgroundImage:
          'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCodkYiTnVBogBa2vE1h5IPPTJjH9zng86wIl_2q7VqyARSpRJUIhk5BoPWPCve6j_9S6e5ng-g3IhXOFB6iAUcGgxZLborWhBA62yBVPwv8jw9GfLCOMXUaXPrafIh8sOAN37PS0QEyQcCnEy5d2EI_TxSeP605IXtY2wpa406udv6IIZl0_2SDFxX6B65nyr8Z-VxiKOD4tUNtB0W2fc5tMZxemA-aQY5SQ6VVVY3gx7NNqfUvY_JlrbnuEsQO3t21wOI4a1RQHU")',
      }}
    />
  )

  return (
    <div className='bg-background-light dark:bg-background-dark font-display flex min-h-screen overflow-hidden text-slate-800 dark:text-slate-200'>
      {/* ─── Sidebar ─────────────────────────────────────────── */}
      <aside className='bg-surface-light dark:bg-surface-dark z-20 flex h-screen w-64 shrink-0 flex-col justify-between overflow-y-auto border-r border-slate-200 dark:border-slate-700'>
        <div className='flex flex-col gap-6 p-6'>
          {/* Brand / tenant switcher */}
          <TenantSwitcher
            activeTenantName={tenantName}
            logoElement={logoEl}
            onAddStudio={handleOpenAddStudio}
          />

          {/* Navigation */}
          <nav className='flex flex-col gap-1'>
            <a
              className='group flex items-center gap-3 rounded-lg px-3 py-2.5 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white'
              href='/dashboard'
            >
              <span className='material-symbols-outlined text-[22px] font-normal text-slate-400 transition-colors group-hover:text-slate-800 dark:group-hover:text-white'>
                dashboard
              </span>
              <span className='text-sm font-medium'>Panel General</span>
            </a>
            <a
              className='bg-primary flex items-center gap-3 rounded-lg px-3 py-2.5 font-semibold text-white shadow-md transition-colors dark:text-white'
              href='#'
            >
              <span className='material-symbols-outlined fill-current text-[22px] font-normal'>
                calendar_month
              </span>
              <span className='text-sm'>Reservas</span>
            </a>
            <a
              className='group flex items-center gap-3 rounded-lg px-3 py-2.5 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white'
              href='#'
            >
              <span className='material-symbols-outlined text-[22px] font-normal text-slate-400 transition-colors group-hover:text-slate-800 dark:group-hover:text-white'>
                videocam
              </span>
              <span className='text-sm font-medium'>Equipo</span>
            </a>
            <a
              className='group flex items-center gap-3 rounded-lg px-3 py-2.5 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white'
              href='#'
            >
              <span className='material-symbols-outlined text-[22px] font-normal text-slate-400 transition-colors group-hover:text-slate-800 dark:group-hover:text-white'>
                group
              </span>
              <span className='text-sm font-medium'>Clientes</span>
            </a>
            <a
              className='group flex items-center gap-3 rounded-lg px-3 py-2.5 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white'
              href='#'
            >
              <span className='material-symbols-outlined text-[22px] font-normal text-slate-400 transition-colors group-hover:text-slate-800 dark:group-hover:text-white'>
                inventory_2
              </span>
              <span className='text-sm font-medium'>Inventario</span>
            </a>
          </nav>
        </div>

        {/* Bottom actions */}
        <div className='flex flex-col gap-2 border-t border-slate-200 p-6 dark:border-slate-700'>
          {/* Configuración — only visible for admins */}
          {isAdmin && (
            <div>
              <button
                onClick={() => setConfigOpen((v) => !v)}
                className='group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white'
              >
                <span className='material-symbols-outlined text-[22px] font-normal text-slate-400 transition-colors group-hover:text-slate-800 dark:group-hover:text-white'>
                  settings
                </span>
                <span className='flex-1 text-left text-sm font-medium'>
                  Configuración
                </span>
                <span
                  className={`material-symbols-outlined text-[16px] font-normal text-slate-400 transition-transform duration-200 ${configOpen ? 'rotate-180' : ''}`}
                >
                  expand_more
                </span>
              </button>

              {/* Sub-items */}
              {configOpen && (
                <div className='mt-1 ml-3 flex flex-col gap-0.5 border-l border-slate-200 pl-4 dark:border-slate-700'>
                  <a
                    href='/configuration/team'
                    className='group flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white'
                  >
                    <span className='material-symbols-outlined text-[18px] font-normal text-slate-400 transition-colors group-hover:text-slate-800 dark:group-hover:text-white'>
                      badge
                    </span>
                    <span className='font-medium'>Equipo</span>
                  </a>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleSignOut}
            className='group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-slate-600 transition-colors hover:bg-slate-100 hover:text-red-700 dark:text-slate-300 dark:hover:bg-slate-800/50 dark:hover:text-red-400'
          >
            <span className='material-symbols-outlined text-[22px] font-normal transition-colors group-hover:text-red-700 dark:group-hover:text-red-400'>
              logout
            </span>
            <span className='text-sm font-medium'>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* ─── Main Content ─────────────────────────────────────── */}
      <main className='bg-background-light dark:bg-background-dark flex h-screen flex-1 flex-col overflow-hidden'>
        {/* Header */}
        <header className='bg-surface-light dark:bg-surface-dark z-10 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-8 dark:border-slate-700'>
          <h2 className='text-lg font-bold tracking-tight text-slate-800 dark:text-white'>
            Resumen de Reservas
          </h2>
          <div className='flex items-center gap-6'>
            <div className='relative hidden w-64 md:block'>
              <span className='material-symbols-outlined absolute top-1/2 left-3 -translate-y-1/2 text-[20px] font-normal text-slate-400'>
                search
              </span>
              <input
                className='focus:ring-primary w-full rounded-lg border-none bg-slate-100 py-2 pr-4 pl-10 text-sm text-slate-900 shadow-inner transition-all placeholder:text-slate-400 focus:bg-white focus:ring-1 focus:outline-none dark:bg-slate-700 dark:text-white dark:focus:bg-slate-600'
                placeholder='Buscar reservas...'
                type='text'
              />
            </div>
            <div className='flex items-center gap-4'>
              <button className='relative rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700'>
                <span className='material-symbols-outlined font-normal'>
                  notifications
                </span>
                <span className='absolute top-2.5 right-2.5 size-2 rounded-full border border-white bg-red-600 dark:border-slate-800' />
              </button>
              <div className='h-8 w-px bg-slate-200 dark:bg-slate-700' />
              <div className='flex items-center gap-3'>
                <div className='hidden text-right sm:block'>
                  <p className='text-sm font-bold text-slate-900 dark:text-white'>
                    {fullName}
                  </p>
                  <p className='text-xs text-slate-500 dark:text-slate-400'>
                    {roleLabel}
                  </p>
                </div>
                <div
                  className='size-10 rounded-full border border-slate-300 bg-slate-200 bg-cover bg-center shadow-sm dark:border-slate-600'
                  style={{
                    backgroundImage:
                      'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAPr__k8LAh6xe1JqrAvKQxye9kjZuMk0Qu6KYOQEcdNwihtO-6x2DZ1HK_UDNHNkdm9aMOLcci_ljM4pva9jURYgS-9rCVFsJ3ZqtHaman68NvO0TpBZC3LJILSRV1jjwRrVXv-av1CKGkAWT0zhPjux6gf6D7c0p7I5QyLa2lzF7kn4wO5sXeJD738SkV2IBOH-L0G48ueLZH2Pglec97-wk9cxGOOrSLETfptUmVYN4E0R00-kgevK0FrhWJqmrkI2p_sqxNIiA")',
                  }}
                />
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className='flex-1 overflow-y-auto p-8'>
          <div className='mx-auto flex max-w-7xl flex-col gap-8'>
            {children}
          </div>
        </div>
      </main>

      {/* ─── Add Studio Modal ─────────────────────────────────── */}
      {showAddStudio && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm'
          onClick={(e) =>
            e.target === e.currentTarget && setShowAddStudio(false)
          }
        >
          <div className='relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-2xl dark:border-slate-700 dark:bg-slate-800'>
            {/* Close */}
            <button
              onClick={() => setShowAddStudio(false)}
              className='absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700'
            >
              <span className='material-symbols-outlined text-[20px] font-normal'>
                close
              </span>
            </button>

            {/* Header */}
            <div className='mb-6 flex items-center gap-3'>
              <div className='flex size-12 items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg dark:bg-slate-700'>
                <span className='material-symbols-outlined text-2xl font-normal'>
                  add_business
                </span>
              </div>
              <div>
                <h2 className='text-xl font-bold text-slate-900 dark:text-white'>
                  Agregar Estudio
                </h2>
                <p className='text-sm text-slate-500 dark:text-slate-400'>
                  Crea un nuevo espacio de trabajo
                </p>
              </div>
            </div>

            {/* Form */}
            <form className='space-y-5' onSubmit={handleCreateStudio}>
              <div>
                <label
                  htmlFor='add-studio-name'
                  className='mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200'
                >
                  Nombre del Estudio
                </label>
                <input
                  id='add-studio-name'
                  type='text'
                  required
                  value={studioName}
                  onChange={(e) => setStudioName(e.target.value)}
                  disabled={isCreating}
                  className='block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-none disabled:opacity-60 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-500'
                  placeholder='Ej. Off Screen Pro'
                />
              </div>

              {createError && (
                <div className='rounded-lg border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-600 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400'>
                  {createError}
                </div>
              )}

              <div className='flex gap-3 pt-2'>
                <button
                  type='button'
                  onClick={() => setShowAddStudio(false)}
                  disabled={isCreating}
                  className='flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700'
                >
                  Cancelar
                </button>
                <button
                  type='submit'
                  disabled={isCreating || !studioName.trim()}
                  className='bg-primary hover:bg-primary-hover flex-1 rounded-lg px-4 py-2.5 text-sm font-bold text-white shadow transition-colors disabled:opacity-60'
                >
                  {isCreating ? 'Creando...' : 'Crear Estudio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
