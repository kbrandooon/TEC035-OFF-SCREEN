import { type ReactNode, useEffect, useRef, useState } from 'react'
import { supabase } from '@/supabase/client'
import { useIsAdmin } from '@/features/auth'
import { getMyTenants } from '@/features/tenants/api/get-my-tenants'
import { switchActiveTenant } from '@/features/tenants/api/switch-active-tenant'

/** A single tenant entry returned by `get_my_tenants` RPC. */
interface Tenant {
  id: string
  name: string
  slug: string
  created_at: string
}

/** Props for TenantSwitcher */
interface TenantSwitcherProps {
  /** Currently active tenant name. */
  activeTenantName: string
  /** The studio logo element or fallback. */
  logoElement: ReactNode
  /** Callback fired when the user clicks \"Agregar Estudio\". */
  onAddStudio: () => void
}

/**
 * Sidebar brand area + dropdown for switching between studios (tenants).
 *
 * - Admins and managers: see the chevron, can switch studios and add new ones.
 * - Employees: static brand block with no dropdown or chevron.
 *
 * @param activeTenantName - Display name of the currently active tenant.
 * @param logoElement - The logo to render on the left side of the trigger.
 * @param onAddStudio - Callback to open the \"Crear Estudio\" form.
 */
export function TenantSwitcher({
  activeTenantName,
  logoElement,
  onAddStudio,
}: TenantSwitcherProps): ReactNode {
  const isAdmin = useIsAdmin()
  const [isOpen, setIsOpen] = useState(false)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [isSwitching, setIsSwitching] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getMyTenants()
      .then(setTenants)
      .catch(() => {
        // Silently fail — user likely has no tenant yet
      })
  }, [])

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSwitch = async (tenantId: string) => {
    setIsSwitching(true)
    setIsOpen(false)
    try {
      await switchActiveTenant(tenantId)
      await supabase.auth.refreshSession()
      window.location.reload()
    } catch {
      setIsSwitching(false)
    }
  }

  // ── All roles: interactive dropdown ───────────────────────────────────────
  return (
    <div className='relative' ref={dropdownRef}>
      {/* Trigger: the entire brand block is clickable */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={isSwitching}
        className='group flex w-full items-center gap-3 rounded-lg px-1 py-1 text-left transition-colors hover:bg-slate-50 disabled:opacity-60 dark:hover:bg-slate-700/50'
        aria-haspopup='listbox'
        aria-expanded={isOpen}
      >
        {/* Logo */}
        {logoElement}

        {/* Name + subtitle + chevron */}
        <div className='flex min-w-0 flex-1 flex-col'>
          <div className='flex items-center gap-1'>
            <span className='truncate text-base leading-tight font-bold tracking-tight text-slate-900 dark:text-white'>
              {isSwitching ? 'Cambiando...' : activeTenantName}
            </span>
            <span
              className={`material-symbols-outlined shrink-0 text-[16px] font-normal text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            >
              expand_more
            </span>
          </div>
          <span className='text-xs font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400'>
            Estudio
          </span>
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className='absolute top-full left-0 z-50 mt-1 w-full min-w-[200px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800'>
          {/* Tenant list */}
          {tenants.length > 0 && (
            <div className='p-1'>
              <p className='px-2 py-1.5 text-[10px] font-bold tracking-widest text-slate-400 uppercase'>
                Mis Estudios
              </p>
              <ul role='listbox' aria-label='Seleccionar estudio'>
                {tenants.map((tenant) => {
                  const isActive = tenant.name === activeTenantName
                  return (
                    <li key={tenant.id}>
                      <button
                        role='option'
                        aria-selected={isActive}
                        onClick={() => !isActive && handleSwitch(tenant.id)}
                        disabled={isActive}
                        className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm transition-colors ${
                          isActive
                            ? 'bg-slate-100 font-semibold text-slate-900 dark:bg-slate-700 dark:text-white'
                            : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/60'
                        }`}
                      >
                        <span
                          className={`material-symbols-outlined text-[16px] font-normal ${isActive ? 'text-primary' : 'text-transparent'}`}
                        >
                          check
                        </span>
                        <span className='truncate'>{tenant.name}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {/* Add studio — only for admins */}
          {isAdmin && (
            <>
              <div className='mx-2 border-t border-slate-100 dark:border-slate-700' />
              <div className='p-1'>
                <button
                  onClick={() => {
                    setIsOpen(false)
                    onAddStudio()
                  }}
                  className='flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/60'
                >
                  <span className='material-symbols-outlined text-[16px] font-normal text-slate-400'>
                    add_circle
                  </span>
                  Agregar Estudio
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
