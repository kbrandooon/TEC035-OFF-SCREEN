import { useEffect, useState } from 'react'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { supabase } from '@/supabase/client'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useAuth, useIsAdmin } from '@/features/auth'
import {
  getPendingInvitations,
  getTenantEmployees,
  inviteMember,
} from '@/features/team'

export const Route = createFileRoute('/configuration/team')({
  // Route-level guard: redirect non-admins before the component even renders
  beforeLoad: ({ context }) => {
    const role = (context as { role?: string }).role
    if (role && role !== 'admin' && role !== 'manager') {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: EmployeesPage,
})

interface Employee {
  user_id: string
  email: string
  first_name: string | null
  last_name: string | null
  is_active: boolean
  role_name: string
  joined_at: string
}

interface PendingInvitation {
  id: string
  email: string
  role_name: string
  expires_at: string
  created_at: string
}

interface Role {
  id: string
  name: string
}

/** Spanish labels for role names stored in the DB */
const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  manager: 'Manager',
  employee: 'Empleado',
}

/** Returns a translated role label, falling back to capitalized raw name. */
function roleLabel(name: string): string {
  return ROLE_LABELS[name] ?? name.charAt(0).toUpperCase() + name.slice(1)
}

/** Role badge color per role name */
function roleBadge(role: string) {
  const map: Record<string, string> = {
    admin:
      'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800/30',
    manager:
      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/30',
    employee:
      'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
  }
  return (
    map[role] ??
    'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400'
  )
}

/** Initial from name or email */
function initials(employee: Employee) {
  if (employee.first_name) {
    return (
      (employee.first_name[0] ?? '') + (employee.last_name?.[0] ?? '')
    ).toUpperCase()
  }
  return employee.email.slice(0, 2).toUpperCase()
}

/**
 * Team page under /configuration/team.
 *
 * Lists all active employees for the current tenant and pending invitations.
 * Allows admins to invite new employees by email + role.
 * Employees are redirected to the dashboard.
 */
function EmployeesPage() {
  const { isLoading: isAuthLoading } = useAuth()
  const isAdmin = useIsAdmin()
  const navigate = Route.useNavigate()

  // All data state — must be declared before any early return
  const [employees, setEmployees] = useState<Employee[]>([])
  const [pending, setPending] = useState<PendingInvitation[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRoleId, setInviteRoleId] = useState('')
  const [isInviting, setIsInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSent, setInviteSent] = useState(false)
  const [inviteMethod, setInviteMethod] = useState<'email' | 'direct'>('email')

  // Guard: wait for auth to finish loading before checking role.
  // Without isAuthLoading check, the guard fires before the JWT is ready
  // and incorrectly redirects admins (role appears as undefined → false).
  useEffect(() => {
    if (!isAuthLoading && !isAdmin) {
      void navigate({ to: '/dashboard' })
    }
  }, [isAuthLoading, isAdmin, navigate])

  const fetchData = async () => {
    setIsLoading(true)
    const [emps, inv, roleRes] = await Promise.allSettled([
      getTenantEmployees(),
      getPendingInvitations(),
      supabase.from('roles').select('id, name').order('name'),
    ])
    if (emps.status === 'fulfilled') setEmployees(emps.value as Employee[])
    if (inv.status === 'fulfilled') setPending(inv.value as PendingInvitation[])
    if (roleRes.status === 'fulfilled' && roleRes.value.data)
      setRoles(roleRes.value.data)
    setIsLoading(false)
  }

  useEffect(() => {
    if (!isAuthLoading && isAdmin) void fetchData()
  }, [isAuthLoading, isAdmin])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsInviting(true)
    setInviteError(null)
    setInviteSent(false)
    try {
      const { method } = await inviteMember(inviteEmail, inviteRoleId)
      setInviteMethod(method)
      setInviteSent(true)
      void fetchData()
    } catch (err) {
      setInviteError(
        err instanceof Error ? err.message : 'Error al enviar la invitación.'
      )
    } finally {
      setIsInviting(false)
    }
  }

  const openInviteModal = () => {
    setInviteEmail('')
    setInviteRoleId(roles.find((r) => r.name === 'employee')?.id ?? '')
    setInviteError(null)
    setInviteSent(false)
    setShowInviteModal(true)
  }

  // Show spinner while auth session is still resolving
  if (isAuthLoading) {
    return (
      <DashboardLayout>
        <div className='flex h-64 items-center justify-center'>
          <span className='material-symbols-outlined animate-spin text-[36px] font-normal text-slate-400'>
            progress_activity
          </span>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      {/* Page header */}
      <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
        <div>
          <h3 className='text-2xl font-bold tracking-tight text-slate-800 dark:text-white'>
            Equipo
          </h3>
          <p className='mt-1 text-sm text-slate-500 dark:text-slate-400'>
            Gestiona el equipo de tu estudio.
          </p>
        </div>
        {/* Only admins can invite new employees */}
        {isAdmin && (
          <button
            onClick={openInviteModal}
            className='bg-primary hover:bg-primary-hover flex items-center gap-2 rounded-lg px-5 py-2.5 font-medium text-white shadow transition-all hover:shadow-md active:scale-[0.98]'
          >
            <span className='material-symbols-outlined text-[20px] font-normal'>
              person_add
            </span>
            Invitar al Equipo
          </button>
        )}
      </div>

      {/* Employees list */}
      <div className='bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 shadow-sm dark:border-slate-700'>
        <div className='border-b border-slate-200 px-6 py-4 dark:border-slate-700'>
          <h4 className='font-bold text-slate-800 dark:text-white'>
            Miembros Activos
            <span className='ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500 dark:bg-slate-700 dark:text-slate-400'>
              {employees.length}
            </span>
          </h4>
        </div>

        {isLoading ? (
          <div className='flex items-center justify-center py-16 text-slate-400'>
            <span className='material-symbols-outlined animate-spin text-[32px] font-normal'>
              progress_activity
            </span>
          </div>
        ) : employees.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-16 text-center'>
            <span className='material-symbols-outlined mb-3 text-[48px] font-normal text-slate-300 dark:text-slate-600'>
              group
            </span>
            <p className='text-sm font-medium text-slate-500 dark:text-slate-400'>
              No hay miembros del equipo aún.
            </p>
          </div>
        ) : (
          <ul className='divide-y divide-slate-100 dark:divide-slate-700/50'>
            {employees.map((emp) => (
              <li
                key={emp.user_id}
                className='flex items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30'
              >
                {/* Avatar */}
                <div className='bg-primary flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm'>
                  {initials(emp)}
                </div>

                {/* Info */}
                <div className='flex min-w-0 flex-1 flex-col'>
                  <span className='truncate text-sm font-semibold text-slate-800 dark:text-white'>
                    {emp.first_name
                      ? `${emp.first_name} ${emp.last_name ?? ''}`
                      : '—'}
                  </span>
                  <span className='truncate text-xs text-slate-500 dark:text-slate-400'>
                    {emp.email}
                  </span>
                </div>

                {/* Role badge */}
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-wide uppercase ${roleBadge(emp.role_name)}`}
                >
                  {roleLabel(emp.role_name)}
                </span>

                {/* Joined date */}
                <span className='hidden text-xs text-slate-400 sm:block dark:text-slate-500'>
                  {new Date(emp.joined_at).toLocaleDateString('es-MX', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Pending Invitations */}
      {pending.length > 0 && (
        <div className='bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 shadow-sm dark:border-slate-700'>
          <div className='border-b border-slate-200 px-6 py-4 dark:border-slate-700'>
            <h4 className='font-bold text-slate-800 dark:text-white'>
              Invitaciones Pendientes
              <span className='ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'>
                {pending.length}
              </span>
            </h4>
          </div>
          <ul className='divide-y divide-slate-100 dark:divide-slate-700/50'>
            {pending.map((inv) => (
              <li
                key={inv.id}
                className='flex items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30'
              >
                <div className='flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-800'>
                  <span className='material-symbols-outlined text-[18px] font-normal text-slate-400'>
                    schedule_send
                  </span>
                </div>
                <div className='flex min-w-0 flex-1 flex-col'>
                  <span className='truncate text-sm font-semibold text-slate-700 dark:text-white'>
                    {inv.email}
                  </span>
                  <span className='text-xs text-slate-400 dark:text-slate-500'>
                    Expira{' '}
                    {new Date(inv.expires_at).toLocaleDateString('es-MX', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-wide uppercase ${roleBadge(inv.role_name)}`}
                >
                  {roleLabel(inv.role_name)}
                </span>
                <span className='rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-amber-700 uppercase dark:border-amber-800/30 dark:bg-amber-900/30 dark:text-amber-400'>
                  Pendiente
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Invite Modal ── */}
      {showInviteModal && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm'
          onClick={(e) =>
            e.target === e.currentTarget && setShowInviteModal(false)
          }
        >
          <div className='relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-2xl dark:border-slate-700 dark:bg-slate-800'>
            <button
              onClick={() => setShowInviteModal(false)}
              className='absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700'
            >
              <span className='material-symbols-outlined text-[20px] font-normal'>
                close
              </span>
            </button>

            <div className='mb-6 flex items-center gap-3'>
              <div className='flex size-12 items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg dark:bg-slate-700'>
                <span className='material-symbols-outlined text-2xl font-normal'>
                  person_add
                </span>
              </div>
              <div>
                <h2 className='text-xl font-bold text-slate-900 dark:text-white'>
                  Invitar al Equipo
                </h2>
                <p className='text-sm text-slate-500 dark:text-slate-400'>
                  Se enviará un correo con el enlace de acceso
                </p>
              </div>
            </div>

            {/* Success state */}
            {inviteSent ? (
              <div className='space-y-4'>
                <div className='rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800/30 dark:bg-emerald-900/20'>
                  <div className='mb-2 flex items-center gap-2'>
                    <span className='material-symbols-outlined text-[20px] font-normal text-emerald-600 dark:text-emerald-400'>
                      {inviteMethod === 'direct'
                        ? 'person_check'
                        : 'mark_email_read'}
                    </span>
                    <p className='text-sm font-semibold text-emerald-800 dark:text-emerald-300'>
                      {inviteMethod === 'direct'
                        ? '¡Usuario añadido al equipo!'
                        : '¡Invitación enviada!'}
                    </p>
                  </div>
                  <p className='text-sm text-emerald-700 dark:text-emerald-400'>
                    {inviteMethod === 'direct' ? (
                      <>
                        <strong>{inviteEmail}</strong> Fue añadido correctamente
                        al equipo..
                      </>
                    ) : (
                      <>
                        Se envió un correo a <strong>{inviteEmail}</strong> con
                        el enlace de acceso. Expira en 7 días.
                      </>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className='w-full rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700'
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <form
                className='space-y-5'
                onSubmit={(e) => void handleInvite(e)}
              >
                <div>
                  <label
                    htmlFor='invite-email'
                    className='mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200'
                  >
                    Correo Electrónico
                  </label>
                  <input
                    id='invite-email'
                    type='email'
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    disabled={isInviting}
                    className='block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-none disabled:opacity-60 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-500'
                    placeholder='miembro@example.com'
                  />
                </div>

                <div>
                  <label
                    htmlFor='invite-role'
                    className='mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200'
                  >
                    Rol
                  </label>
                  <select
                    id='invite-role'
                    required
                    value={inviteRoleId}
                    onChange={(e) => setInviteRoleId(e.target.value)}
                    disabled={isInviting}
                    className='block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-none disabled:opacity-60 dark:border-slate-600 dark:bg-slate-700 dark:text-white'
                  >
                    <option value=''>Selecciona un rol...</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {roleLabel(r.name)}
                      </option>
                    ))}
                  </select>
                </div>

                {inviteError && (
                  <div className='rounded-lg border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-600 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400'>
                    {inviteError}
                  </div>
                )}

                <div className='flex gap-3 pt-2'>
                  <button
                    type='button'
                    onClick={() => setShowInviteModal(false)}
                    disabled={isInviting}
                    className='flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700'
                  >
                    Cancelar
                  </button>
                  <button
                    type='submit'
                    disabled={isInviting || !inviteEmail || !inviteRoleId}
                    className='bg-primary hover:bg-primary-hover flex-1 rounded-lg px-4 py-2.5 text-sm font-bold text-white shadow transition-colors disabled:opacity-60'
                  >
                    {isInviting ? 'Generando enlace...' : 'Generar Invitación'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
