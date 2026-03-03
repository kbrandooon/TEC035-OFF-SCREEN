import type { InventoryFormValues, MovementType } from '../types'

interface InventoryCreateModalProps {
  equipmentOptions: { id: string; name: string }[]
  form: InventoryFormValues
  onChange: (values: InventoryFormValues) => void
  onClose: () => void
  onSave: () => void
  isSaving: boolean
  error: string | null
}

const MOVEMENT_LABELS: Record<MovementType, string> = {
  in: 'Entrada',
  out: 'Salida',
  adjustment: 'Ajuste',
}

const inputClass =
  'block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:border-slate-400 focus:ring-1 focus:ring-slate-400 focus:outline-none dark:border-slate-600 dark:bg-slate-700/50 dark:text-white dark:placeholder-slate-500'

/**
 * Modal overlay for registering a new inventory movement.
 * Styled identically to the update form in InventoryDetailModal.
 */
export function InventoryCreateModal({
  equipmentOptions,
  form,
  onChange,
  onClose,
  onSave,
  isSaving,
  error,
}: InventoryCreateModalProps) {
  const set = <K extends keyof InventoryFormValues>(
    key: K,
    value: InventoryFormValues[K]
  ) => onChange({ ...form, [key]: value })

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm'
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSaving) onClose()
      }}
    >
      <div className='relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800'>
        {/* Close */}
        <button
          onClick={onClose}
          disabled={isSaving}
          className='absolute top-4 right-4 flex size-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 disabled:opacity-40 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
        >
          <span className='material-symbols-outlined text-[18px] font-normal'>
            close
          </span>
        </button>

        <div className='space-y-5 p-6'>
          {/* Header */}
          <div className='pr-10'>
            <h2 className='text-lg font-bold text-slate-900 dark:text-white'>
              Registrar Movimiento
            </h2>
            <p className='mt-0.5 text-sm text-slate-500 dark:text-slate-400'>
              Agrega una entrada, salida o ajuste de stock.
            </p>
          </div>

          <div className='h-px bg-slate-100 dark:bg-slate-700' />

          {/* Fields */}
          <div className='space-y-4'>
            {/* Row 1: Equipo + Tipo */}
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='mb-1.5 block text-xs font-semibold tracking-wider text-slate-500 uppercase'>
                  Equipo *
                </label>
                <select
                  value={form.equipment_id}
                  onChange={(e) => set('equipment_id', e.target.value)}
                  className={inputClass}
                >
                  <option value=''>Selecciona equipo...</option>
                  {equipmentOptions.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className='mb-1.5 block text-xs font-semibold tracking-wider text-slate-500 uppercase'>
                  Tipo *
                </label>
                <select
                  value={form.movement_type}
                  onChange={(e) =>
                    set('movement_type', e.target.value as MovementType)
                  }
                  className={inputClass}
                >
                  {(
                    Object.entries(MOVEMENT_LABELS) as [MovementType, string][]
                  ).map(([val, label]) => (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Cantidad + Fecha */}
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='mb-1.5 block text-xs font-semibold tracking-wider text-slate-500 uppercase'>
                  Cantidad *
                </label>
                <input
                  type='number'
                  min={1}
                  value={form.quantity}
                  onChange={(e) => set('quantity', Number(e.target.value))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className='mb-1.5 block text-xs font-semibold tracking-wider text-slate-500 uppercase'>
                  Fecha *
                </label>
                <input
                  type='date'
                  value={form.date}
                  onChange={(e) => set('date', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Clasificación (full width) */}
            <div>
              <label className='mb-1.5 block text-xs font-semibold tracking-wider text-slate-500 uppercase'>
                Clasificación
              </label>
              <input
                type='text'
                value={form.clasification}
                onChange={(e) => set('clasification', e.target.value)}
                placeholder='Ej. Compra, Préstamo...'
                className={inputClass}
              />
            </div>

            {/* Descripción (full width) */}
            <div>
              <label className='mb-1.5 block text-xs font-semibold tracking-wider text-slate-500 uppercase'>
                Descripción
              </label>
              <input
                type='text'
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder='Notas adicionales...'
                className={inputClass}
              />
            </div>
          </div>

          {error && (
            <div className='rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400'>
              {error}
            </div>
          )}

          <div className='h-px bg-slate-100 dark:bg-slate-700' />

          {/* Actions */}
          <div className='flex gap-3'>
            <button
              onClick={onClose}
              disabled={isSaving}
              className='flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700'
            >
              Cancelar
            </button>
            <button
              onClick={onSave}
              disabled={isSaving}
              className='bg-primary hover:bg-primary-hover flex-1 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow transition disabled:opacity-60'
            >
              {isSaving ? 'Guardando...' : 'Guardar Movimiento'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
