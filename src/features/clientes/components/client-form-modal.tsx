import { useRef, useState } from 'react'
import type { Customer, CustomerFormValues } from '../types'

interface ClientFormModalProps {
  /** When defined, the modal is in edit mode pre-filled with this customer. */
  client: Customer | null
  isOpen: boolean
  isSaving: boolean
  error: string | null
  onClose: () => void
  onSave: (values: CustomerFormValues) => Promise<void>
}

/**
 * Modal dialog for creating or editing a customer.
 * Renders an inner keyed component so form state resets automatically
 * whenever `client` or `isOpen` changes — avoiding `setState` inside effects.
 */
export function ClientFormModal(props: ClientFormModalProps) {
  if (!props.isOpen) return null
  // Key on client.id (or 'new') so inner state resets cleanly on open/switch
  const key = props.client?.id ?? 'new'
  return <ClientFormInner key={key} {...props} />
}

/**
 * Inner form component. Initializes its own state directly from props on mount.
 * Separated from ClientFormModal so that changing `key` triggers a fresh mount.
 *
 * @param client - Customer to pre-fill (null when creating a new record).
 * @param isOpen - Controls modal visibility.
 * @param isSaving - Disables inputs while the parent is persisting.
 * @param error - Server-side error message to display inside the form.
 * @param onClose - Callback to dismiss the modal without saving.
 * @param onSave - Async callback called with the validated form values.
 */
function ClientFormInner({
  client,
  isSaving,
  error,
  onClose,
  onSave,
}: ClientFormModalProps) {
  const [names, setNames] = useState(client?.names ?? '')
  const [lastName, setLastName] = useState(client?.last_name ?? '')
  const [email, setEmail] = useState(client?.email ?? '')
  const [phone, setPhone] = useState(client?.phone ?? '')
  const namesRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave({ names, last_name: lastName, email, phone })
  }

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm'
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className='relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-2xl dark:border-slate-700 dark:bg-slate-800'>
        {/* Close */}
        <button
          onClick={onClose}
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
              {client ? 'edit' : 'person_add'}
            </span>
          </div>
          <div>
            <h2 className='text-xl font-bold text-slate-900 dark:text-white'>
              {client ? 'Editar Cliente' : 'Nuevo Cliente'}
            </h2>
            <p className='text-sm text-slate-500 dark:text-slate-400'>
              {client
                ? 'Actualiza los datos del cliente.'
                : 'Registra un nuevo cliente.'}
            </p>
          </div>
        </div>

        {/* Form */}
        <form className='space-y-4' onSubmit={(e) => void handleSubmit(e)}>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label
                htmlFor='client-names'
                className='mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200'
              >
                Nombres <span className='text-red-500'>*</span>
              </label>
              <input
                id='client-names'
                ref={namesRef}
                type='text'
                required
                value={names}
                onChange={(e) => setNames(e.target.value)}
                disabled={isSaving}
                className='block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-none disabled:opacity-60 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-500'
                placeholder='John'
              />
            </div>
            <div>
              <label
                htmlFor='client-lastname'
                className='mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200'
              >
                Apellido <span className='text-red-500'>*</span>
              </label>
              <input
                id='client-lastname'
                type='text'
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={isSaving}
                className='block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-none disabled:opacity-60 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-500'
                placeholder='Doe'
              />
            </div>
          </div>

          <div>
            <label
              htmlFor='client-email'
              className='mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200'
            >
              Correo Electrónico
            </label>
            <input
              id='client-email'
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSaving}
              className='block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-none disabled:opacity-60 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-500'
              placeholder='cliente@ejemplo.com'
            />
          </div>

          <div>
            <label
              htmlFor='client-phone'
              className='mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200'
            >
              Teléfono
            </label>
            <input
              id='client-phone'
              type='tel'
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isSaving}
              className='block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-none disabled:opacity-60 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-500'
              placeholder='+52 55 1234 5678'
            />
          </div>

          {error && (
            <div className='rounded-lg border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-600 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400'>
              {error}
            </div>
          )}

          <div className='flex gap-3 pt-2'>
            <button
              type='button'
              onClick={onClose}
              disabled={isSaving}
              className='flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700'
            >
              Cancelar
            </button>
            <button
              type='submit'
              disabled={isSaving || !names.trim() || !lastName.trim()}
              className='bg-primary hover:bg-primary-hover flex-1 rounded-lg px-4 py-2.5 text-sm font-bold text-white shadow transition-colors disabled:opacity-60'
            >
              {isSaving
                ? 'Guardando...'
                : client
                  ? 'Guardar Cambios'
                  : 'Crear Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
