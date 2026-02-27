import { useEffect, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { supabase } from '@/supabase/client'
import { signOut } from '@/features/auth/api/sign-out'
import { useAuth } from '@/features/auth/hooks/use-auth'
import type { Profile } from '@/features/profiles/types'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const navigate = useNavigate()
  const { session, user, isLoading } = useAuth()
  const [tenantName, setTenantName] = useState<string>('Cargando...')
  const [profilesList, setProfilesList] = useState<Profile[]>([])

  // Onboarding Setup State
  const [studioName, setStudioName] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [isCreatingTenant, setIsCreatingTenant] = useState(false)
  const [onboardError, setOnboardError] = useState<string | null>(null)
  const [isSigningOut, setIsSigningOut] = useState(false)

  useEffect(() => {
    async function fetchTenantData() {
      // If no valid auth user, do nothing
      if (!user) return

      // Pre-check if this user has no tenant so we can skip the failed database requests
      const embeddedClaims = session?.user?.app_metadata || {}
      if (!embeddedClaims.tenant_id) return

      // Because of RLS, fetching from "tenants" will ONLY return
      // the tenant that matches the ID embedded in the JWT's claims.
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('id, name')
        .limit(1)
        .maybeSingle() // Prevents PGRST116 error if 0 rows are returned

      if (tenantError) {
        setTenantName('Error al cargar (Oculto)')
      } else if (tenantData) {
        setTenantName(tenantData.name)
      } else {
        setTenantName('No se encontró el estudio (0 filas).')
      }

      // Similarly, fetching profiles will ONLY return profiles
      // that belong to the user's specific tenant.
      const { data: profilesData } = await supabase
        .from('profiles')
        .select(
          'id, tenant_id, first_name, last_name, email, is_active, created_at, updated_at'
        )

      if (profilesData) {
        setProfilesList(profilesData)
      }
    }

    if (!isLoading) {
      fetchTenantData()
    }
  }, [user, session?.user?.app_metadata, isLoading])

  const handleSignOut = async () => {
    setIsSigningOut(true)
    await signOut()

    // Usamos SPA navigation silenciosa
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

  if (isLoading) return null
  // Blank background to prevent any flash while the SPA navigation executes instantly
  if (isSigningOut) return <div className='min-h-screen bg-slate-50'></div>
  if (!user)
    return (
      <div className='font-display p-8'>
        No autenticado. Por favor, inicia sesión.
      </div>
    )

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
    <div className='font-display min-h-screen bg-slate-50 p-8'>
      <div className='mx-auto max-w-4xl space-y-8'>
        {/* Header Section */}
        <header className='flex items-center justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm'>
          <div>
            <h1 className='text-3xl font-bold text-slate-900'>
              Dashboard Principal
            </h1>
            <p className='mt-1 text-slate-500'>
              Estás conectado como:{' '}
              <span className='text-primary font-semibold'>{user.email}</span>
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className='rounded-lg bg-red-50 px-4 py-2 font-semibold text-red-600 transition-colors hover:bg-red-100'
          >
            Cerrar Sesión
          </button>
        </header>

        {/* Tenant Verification Card */}
        <div className='space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm'>
          <h2 className='border-b pb-2 text-xl font-bold text-slate-800'>
            🏢 Aislamiento Multitenant (RLS en Acción)
          </h2>
          <p className='leading-relaxed text-slate-600'>
            Gracias al Row-Level Security, esta consulta a la base de datos (
            <code>select * from tenants</code>) ha sido filtrada automáticamente
            por tu Token JWT. Solo puedes ver la información de tu propio
            estudio.
          </p>
          <div className='rounded-lg border border-slate-200 bg-slate-100 p-4 font-mono text-sm'>
            Estudio actual:{' '}
            <span className='text-primary text-lg font-bold'>{tenantName}</span>
          </div>
        </div>

        {/* Profiles Verfifcation Card */}
        <div className='space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm'>
          <h2 className='border-b pb-2 text-xl font-bold text-slate-800'>
            👥 Perfiles de este Estudio
          </h2>
          <p className='leading-relaxed text-slate-600'>
            Esta es la lista de usuarios que existen dentro de{' '}
            <strong>{tenantName}</strong>. Es imposible ver usuarios de otros
            estudios.
          </p>
          <div className='space-y-3'>
            {profilesList.map((p) => (
              <div
                key={p.id}
                className='flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 p-3'
              >
                <div>
                  <div className='font-semibold text-slate-800'>
                    {p.first_name || 'Sin Nombre'}{' '}
                    {p.last_name || 'Sin Apellido'}
                  </div>
                  <div className='text-sm text-slate-500'>{p.email}</div>
                </div>
                <span className='rounded-full bg-indigo-100 px-2 py-1 text-xs font-bold text-indigo-700'>
                  ID: {p.id.split('-')[0]}...
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
