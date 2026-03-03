import { useState } from 'react'
import type { Customer } from '../types'

interface ClientListProps {
  clients: Customer[]
  onEdit: (client: Customer) => void
  onDelete: (client: Customer) => void
}

/** Derives initials from names + last_name. */
function initials(customer: Customer): string {
  return (
    (customer.names[0] ?? '') + (customer.last_name[0] ?? '')
  ).toUpperCase()
}

/**
 * Renders the full customer list with edit and delete actions.
 * Shows an empty state when no customers exist.
 */
export function ClientList({ clients, onEdit, onDelete }: ClientListProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  if (clients.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50 py-20 text-center dark:border-slate-700 dark:bg-slate-800/20'>
        <span className='material-symbols-outlined mb-3 text-[52px] font-normal text-slate-300 dark:text-slate-600'>
          group
        </span>
        <p className='text-sm font-semibold text-slate-500 dark:text-slate-400'>
          Aún no hay clientes registrados.
        </p>
        <p className='mt-1 text-xs text-slate-400 dark:text-slate-500'>
          Haz clic en "Nuevo Cliente" para agregar el primero.
        </p>
      </div>
    )
  }

  return (
    <div className='bg-surface-light dark:bg-surface-dark overflow-hidden rounded-xl border border-slate-200 shadow-sm dark:border-slate-700'>
      <ul className='divide-y divide-slate-100 dark:divide-slate-700/50'>
        {clients.map((client) => (
          <li
            key={client.id}
            className='flex items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30'
          >
            {/* Avatar */}
            <div className='bg-primary flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm'>
              {initials(client)}
            </div>

            {/* Info */}
            <div className='flex min-w-0 flex-1 flex-col'>
              <span className='truncate text-sm font-semibold text-slate-800 dark:text-white'>
                {client.names} {client.last_name}
              </span>
              <div className='mt-0.5 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400'>
                {client.email && (
                  <span className='flex items-center gap-1'>
                    <span className='material-symbols-outlined text-[14px] font-normal'>
                      mail
                    </span>
                    {client.email}
                  </span>
                )}
                {client.phone && (
                  <span className='flex items-center gap-1'>
                    <span className='material-symbols-outlined text-[14px] font-normal'>
                      phone
                    </span>
                    {client.phone}
                  </span>
                )}
              </div>
            </div>

            {/* Joined date */}
            <span className='hidden text-xs text-slate-400 sm:block dark:text-slate-500'>
              {new Date(client.created_at).toLocaleDateString('es-MX', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>

            {/* Actions */}
            <div className='flex items-center gap-1'>
              {confirmDeleteId === client.id ? (
                <>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className='rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700'
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      setConfirmDeleteId(null)
                      onDelete(client)
                    }}
                    className='rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-600 transition-colors hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30'
                  >
                    Confirmar
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => onEdit(client)}
                    className='rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-white'
                    title='Editar cliente'
                  >
                    <span className='material-symbols-outlined text-[18px] font-normal'>
                      edit
                    </span>
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(client.id)}
                    className='rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400'
                    title='Eliminar cliente'
                  >
                    <span className='material-symbols-outlined text-[18px] font-normal'>
                      delete
                    </span>
                  </button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
