import { useRef, useState } from 'react'
import { useClients } from '@/features/clientes'
import { useEquipment } from '@/features/equipo'
import type { Reservation, ReservationFormValues } from '../types'
import { EquipmentSelector } from './equipment-selector'
import { ReservationPreview } from './reservation-preview'

interface ReservationFormModalProps {
  isOpen: boolean
  isSaving: boolean
  /** Pre-filled date (e.g. when opened from a calendar day). */
  initialDate?: string
  /** When provided, the modal operates in edit mode pre-filling all fields. */
  reservation?: Reservation | null
  error: string | null
  onClose: () => void
  onSave: (values: ReservationFormValues) => Promise<void>
}

/** Default empty form state. */
function defaultValues(date?: string): ReservationFormValues {
  return {
    date: date ?? '',
    endDate: date ?? '',
    startTime: '09:00',
    endTime: '13:00',
    clientId: '',
    clientName: '',
    address: '',
    notes: '',
    requiresInvoice: false,
    equipmentItems: [],
  }
}

/**
 * Full-screen split-panel modal for creating or editing a reservation.
 *
 * Left panel  → All form fields (date, time, client, address, equipment, financials, notes).
 * Right panel → Live `ReservationPreview` — a styled booking-sheet document
 *               that reflects every field change in real time.
 */
export function ReservationFormModal({
  isOpen,
  isSaving,
  initialDate,
  reservation,
  error,
  onClose,
  onSave,
}: ReservationFormModalProps) {
  // Derive initial form values at mount time.
  // The parent must supply a stable `key` prop (e.g. `reservation?.id ?? 'new'`)
  // so that React unmounts and remounts this component whenever the target
  // reservation changes — making the lazy initializer re-run cleanly.
  const [values, setValues] = useState<ReservationFormValues>(() =>
    reservation
      ? {
          date: reservation.date,
          endDate: reservation.endDate,
          startTime: reservation.startTime,
          endTime: reservation.endTime,
          clientId: reservation.clientId,
          clientName: reservation.clientName,
          address: reservation.address,
          notes: reservation.notes,
          requiresInvoice: reservation.requiresInvoice,
          equipmentItems: reservation.equipmentItems,
        }
      : defaultValues(initialDate)
  )
  const previewRef = useRef<HTMLDivElement>(null)

  // ── Data dependencies ────────────────────────────────────────────────────────
  const { clients, isLoading: clientsLoading } = useClients()
  const { equipment, isLoading: equipLoading } = useEquipment({ page: 1 })

  if (!isOpen) return null

  // ── Field helpers ────────────────────────────────────────────────────────────
  const set = <K extends keyof ReservationFormValues>(
    key: K,
    val: ReservationFormValues[K]
  ) => setValues((prev) => ({ ...prev, [key]: val }))

  const handleClientChange = (clientId: string) => {
    const found = clients.find((c) => c.id === clientId)
    setValues((prev) => ({
      ...prev,
      clientId,
      clientName: found ? `${found.names} ${found.last_name}` : '',
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave(values)
  }

  // ── Label class shared across all inputs ─────────────────────────────────────
  const labelCls =
    'mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400'
  const inputCls =
    'block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-[#2d3748] focus:ring-1 focus:ring-[#2d3748] focus:outline-none disabled:opacity-60 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-500'

  return (
    <div
      className='fixed inset-0 z-50 flex items-stretch bg-slate-900/70 backdrop-blur-sm'
      onClick={(e) => e.target === e.currentTarget && !isSaving && onClose()}
    >
      {/* ── Modal Shell ──────────────────────────────────────────────────────── */}
      <div className='relative m-auto flex h-[95vh] w-[96vw] max-w-7xl overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-2xl dark:border-slate-700 dark:bg-slate-900'>
        {/* ════════ LEFT PANEL — Form ════════ */}
        <div className='flex w-full flex-col overflow-hidden lg:w-[45%] lg:border-r lg:border-slate-200 lg:dark:border-slate-700'>
          {/* Panel header */}
          <div className='flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-700 dark:bg-slate-800'>
            <div className='flex items-center gap-3'>
              <div className='flex size-10 items-center justify-center rounded-xl bg-[#2d3748] text-white shadow'>
                <span className='material-symbols-outlined text-[20px] font-normal'>
                  calendar_add_on
                </span>
              </div>
              <div>
                <h2 className='text-base font-bold text-slate-900 dark:text-white'>
                  {reservation ? 'Editar Reserva' : 'Nueva Reserva'}
                </h2>
                <p className='text-xs text-slate-500 dark:text-slate-400'>
                  {reservation
                    ? 'Modifica los datos de la reserva'
                    : 'Completa los datos de la reserva'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSaving}
              className='rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40 dark:hover:bg-slate-700'
            >
              <span className='material-symbols-outlined text-[20px] font-normal'>
                close
              </span>
            </button>
          </div>

          {/* Scrollable form body */}
          <form
            id='reservation-form'
            onSubmit={(e) => void handleSubmit(e)}
            className='custom-scrollbar flex-1 space-y-5 overflow-y-auto bg-white px-6 py-5 dark:bg-slate-800'
          >
            {/* Date + Times */}
            <div>
              <p className='mb-3 text-xs font-bold tracking-wider text-[#2d3748] uppercase dark:text-slate-300'>
                Fecha y Horario
              </p>
              <div className='grid grid-cols-2 gap-4'>
                {/* Row 1: start date + end date */}
                <div>
                  <label htmlFor='res-date' className={labelCls}>
                    Fecha de Inicio *
                  </label>
                  <input
                    id='res-date'
                    type='date'
                    required
                    value={values.date}
                    onChange={(e) => set('date', e.target.value)}
                    disabled={isSaving}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor='res-end-date' className={labelCls}>
                    Fecha de Fin *
                  </label>
                  <input
                    id='res-end-date'
                    type='date'
                    required
                    min={values.date || undefined}
                    value={values.endDate}
                    onChange={(e) => set('endDate', e.target.value)}
                    disabled={isSaving}
                    className={inputCls}
                  />
                </div>
                {/* Row 2: start time + end time */}
                <div>
                  <label htmlFor='res-start' className={labelCls}>
                    Hora de Inicio *
                  </label>
                  <input
                    id='res-start'
                    type='time'
                    required
                    value={values.startTime}
                    onChange={(e) => set('startTime', e.target.value)}
                    disabled={isSaving}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor='res-end' className={labelCls}>
                    Hora de Fin *
                  </label>
                  <input
                    id='res-end'
                    type='time'
                    required
                    value={values.endTime}
                    onChange={(e) => set('endTime', e.target.value)}
                    disabled={isSaving}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            {/* Client + Address */}
            <div>
              <p className='mb-3 text-xs font-bold tracking-wider text-[#2d3748] uppercase dark:text-slate-300'>
                Cliente
              </p>
              <div className='space-y-4'>
                <div>
                  <label htmlFor='res-client' className={labelCls}>
                    Nombre *
                  </label>
                  {clientsLoading ? (
                    <div className='h-10 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-700' />
                  ) : (
                    <select
                      id='res-client'
                      required
                      value={values.clientId}
                      onChange={(e) => handleClientChange(e.target.value)}
                      disabled={isSaving}
                      className={inputCls}
                    >
                      <option value=''>— Selecciona un cliente —</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.names} {c.last_name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label htmlFor='res-address' className={labelCls}>
                    Dirección / Locación *
                  </label>
                  <input
                    id='res-address'
                    type='text'
                    required
                    value={values.address}
                    onChange={(e) => set('address', e.target.value)}
                    disabled={isSaving}
                    placeholder='Ej. Av. Presidente Masaryk 111, CDMX'
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            {/* Equipment */}
            <div>
              <p className='mb-3 text-xs font-bold tracking-wider text-[#2d3748] uppercase dark:text-slate-300'>
                Equipo
              </p>
              {equipLoading ? (
                <div className='h-10 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-700' />
              ) : (
                <EquipmentSelector
                  availableEquipment={equipment}
                  selectedItems={values.equipmentItems}
                  onChange={(items) => set('equipmentItems', items)}
                  disabled={isSaving}
                  reservationStart={
                    values.date && values.startTime
                      ? `${values.date}T${values.startTime}`
                      : undefined
                  }
                  reservationEnd={
                    values.endDate && values.endTime
                      ? `${values.endDate}T${values.endTime}`
                      : undefined
                  }
                />
              )}
            </div>

            {/* Notes */}
            <div>
              <p className='mb-3 text-xs font-bold tracking-wider text-[#2d3748] uppercase dark:text-slate-300'>
                Notas
              </p>
              <textarea
                id='res-notes'
                rows={3}
                value={values.notes}
                onChange={(e) => set('notes', e.target.value)}
                disabled={isSaving}
                placeholder='Indicaciones especiales, requerimientos técnicos, etc.'
                className={`${inputCls} resize-none`}
              />
            </div>

            {/* Error */}
            {error && (
              <div className='rounded-lg border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-600 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400'>
                {error}
              </div>
            )}
          </form>

          {/* Panel footer — actions */}
          <div className='flex shrink-0 gap-3 border-t border-slate-200 bg-white px-6 py-4 dark:border-slate-700 dark:bg-slate-800'>
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
              form='reservation-form'
              disabled={isSaving || !values.clientId || !values.date}
              className='flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#2d3748] px-4 py-2.5 text-sm font-bold text-white shadow transition-colors hover:bg-[#1a202c] disabled:opacity-60'
            >
              {isSaving ? (
                <>
                  <span className='material-symbols-outlined animate-spin text-[16px] font-normal'>
                    progress_activity
                  </span>
                  Guardando…
                </>
              ) : (
                <>
                  <span className='material-symbols-outlined text-[16px] font-normal'>
                    check_circle
                  </span>
                  Guardar Reserva
                </>
              )}
            </button>
          </div>
        </div>

        {/* ════════ RIGHT PANEL — Live Preview ════════ */}
        <div className='hidden flex-1 flex-col overflow-hidden bg-slate-100 lg:flex dark:bg-slate-950'>
          {/* Preview header bar */}
          <div className='flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 py-3 dark:border-slate-700 dark:bg-slate-800'>
            <div className='flex items-center gap-2 text-xs font-bold tracking-wider text-slate-500 uppercase'>
              <span className='material-symbols-outlined text-[15px] font-normal text-[#2d3748]'></span>
            </div>
            <span className='rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold tracking-widest text-amber-700 uppercase dark:bg-amber-900/30 dark:text-amber-400'>
              Vista Previa del Documento
            </span>
          </div>

          {/* Preview body */}
          <div
            ref={previewRef}
            className='custom-scrollbar flex-1 overflow-y-auto p-6'
          >
            <ReservationPreview values={values} />
          </div>
        </div>
      </div>
    </div>
  )
}
