import { useEffect, useRef, useState } from 'react'
import type { Reservation, ReservationStatus } from '../types'
import { openReservationDocument } from '../utils/reservation-doc-generator'
import { formatLocalDate } from '@/utils/date-utils'

interface ReservationDetailModalProps {
  reservation: Reservation | null
  onClose: () => void
  onUpdateStatus: (id: string, status: ReservationStatus) => Promise<void>
  onEdit: (reservation: Reservation) => void
  onDelete: (id: string) => Promise<void>
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<ReservationStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  canceled: 'Cancelada',
}

const STATUS_STYLES: Record<ReservationStatus, string> = {
  pending:
    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700',
  confirmed:
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700',
  canceled:
    'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700',
}

const STATUS_DOT: Record<ReservationStatus, string> = {
  pending: 'bg-amber-400',
  confirmed: 'bg-emerald-400',
  canceled: 'bg-red-400',
}


// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return formatLocalDate(iso, "d 'de' MMMM 'de' yyyy")
}

function fmt24to12(isoDate: string, time: string): string {
  if (!time) return '—'
  return formatLocalDate(`${isoDate}T${time}`, 'hh:mm a')
}

function calcDays(start: string, end: string): number {
  if (!start || !end) return 1
  const diff = new Date(end).getTime() - new Date(start).getTime()
  return Math.max(Math.round(diff / 86_400_000) + 1, 1)
}

const fmt = (n: number) =>
  n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * Slide-in detail panel for a reservation.
 * Supports inline status change, edit (opens form modal) and delete (with confirmation).
 */
export function ReservationDetailModal({
  reservation: r,
  onClose,
  onUpdateStatus,
  onEdit,
  onDelete,
}: ReservationDetailModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null)
  const [statusOpen, setStatusOpen] = useState(false)
  const [deleteMode, setDeleteMode] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Reset local state when a different reservation is selected
  useEffect(() => {
    setStatusOpen(false)
    setDeleteMode(false)
    setIsUpdating(false)
    setIsDeleting(false)
  }, [r?.id])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  if (!r) return null

  const days = calcDays(r.date, r.endDate)
  const multiDay = days > 1

  const equipmentTotal = r.equipmentItems.reduce(
    (acc, item) => acc + item.quantity * item.daily_rate * days,
    0
  )
  const iva = r.requiresInvoice ? equipmentTotal * 0.16 : 0
  const total = equipmentTotal + iva

  async function handleStatusChange(status: ReservationStatus) {
    setStatusOpen(false)
    setIsUpdating(true)
    try {
      await onUpdateStatus(r!.id, status)
    } finally {
      setIsUpdating(false)
    }
  }

  async function handleDelete() {
    setIsDeleting(true)
    try {
      await onDelete(r!.id)
      onClose()
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div
      ref={backdropRef}
      className='fixed inset-0 z-50 flex items-start justify-end bg-black/40 backdrop-blur-sm'
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose()
      }}
    >
      {/* Panel */}
      <div className='flex h-full w-full max-w-[700px] flex-col bg-white shadow-2xl dark:bg-slate-900'>
        {/* ── Header ── */}
        <div className='flex items-start justify-between border-b border-slate-700 bg-[#2d3748] px-6 py-5'>
          <div className='min-w-0 flex-1 pr-4'>
            <p className='text-xs font-bold tracking-widest text-slate-400 uppercase'>
              Detalle de Reserva
            </p>
            <h2 className='mt-0.5 truncate text-xl font-bold text-white'>
              {r.clientName || r.clientProfileId || 'Sin cliente'}
            </h2>
          </div>

          {/* Action buttons */}
          <div className='flex shrink-0 items-center gap-2'>
            {/* Edit */}
            <button
              onClick={() => {
                onClose()
                onEdit(r)
              }}
              className='flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/20'
            >
              <span className='material-symbols-outlined text-[14px] font-normal'>
                edit
              </span>
              Editar
            </button>
            {/* Delete */}
            <button
              onClick={() => setDeleteMode(true)}
              className='flex items-center gap-1.5 rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/30'
            >
              <span className='material-symbols-outlined text-[14px] font-normal'>
                delete
              </span>
              Eliminar
            </button>
            {/* Close */}
            <button
              onClick={onClose}
              className='rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white'
            >
              <span className='material-symbols-outlined text-[22px] font-normal'>
                close
              </span>
            </button>
          </div>
        </div>

        {/* ── Delete confirmation banner ── */}
        {deleteMode && (
          <div className='flex items-center justify-between gap-4 border-b border-red-200 bg-red-50 px-6 py-3.5 dark:border-red-800 dark:bg-red-900/20'>
            <p className='text-sm font-semibold text-red-700 dark:text-red-300'>
              ¿Eliminar esta reserva permanentemente?
            </p>
            <div className='flex gap-2'>
              <button
                onClick={() => setDeleteMode(false)}
                className='rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300'
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className='rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-60'
              >
                {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        )}

        {/* ── Body ── */}
        <div className='flex flex-1 flex-col overflow-y-auto'>
          {/* Status row */}
          <div className='relative flex items-center gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800'>
            <span className='text-xs font-bold tracking-wider text-slate-400 uppercase'>
              Estado:
            </span>
            <div className='relative'>
              <button
                onClick={() => setStatusOpen((v) => !v)}
                disabled={isUpdating}
                className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold tracking-wide uppercase transition-all hover:opacity-80 disabled:opacity-40 ${STATUS_STYLES[r.status]}`}
              >
                <span
                  className={`size-1.5 rounded-full ${STATUS_DOT[r.status]}`}
                />
                {isUpdating ? 'Actualizando...' : STATUS_LABELS[r.status]}
                <span className='material-symbols-outlined text-[13px] font-normal'>
                  expand_more
                </span>
              </button>

              {statusOpen && (
                <div className='absolute top-full left-0 z-10 mt-1 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800'>
                  {(
                    ['pending', 'confirmed', 'canceled'] as ReservationStatus[]
                  ).map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-semibold transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 ${s === r.status ? 'opacity-40' : ''}`}
                    >
                      <span
                        className={`size-2 rounded-full ${STATUS_DOT[s]}`}
                      />
                      {STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Key info strip ── */}
          <div className='grid grid-cols-2 gap-4 border-b border-slate-100 px-6 py-5 sm:grid-cols-4 dark:border-slate-800'>
            <InfoBlock
              icon='event'
              label='Fecha inicio'
              value={formatDate(r.date)}
            />
            <InfoBlock
              icon='event_available'
              label='Fecha fin'
              value={formatDate(r.endDate || r.date)}
            />
            <InfoBlock
              icon='calendar_month'
              label='Duración'
              value={
                multiDay
                  ? `${days} días`
                  : r.startTime
                    ? `${fmt24to12(r.date, r.startTime)} – ${fmt24to12(r.date, r.endTime)}`
                    : '—'
              }
            />
          </div>

          {/* ── Address & Notes ── */}
          {(r.address || r.notes) && (
            <div className='space-y-4 border-b border-slate-100 px-6 py-5 dark:border-slate-800'>
              {r.address && (
                <div>
                  <Label icon='location_on'>
                    Dirección / Locación del Cliente
                  </Label>
                  <p className='mt-1 text-sm text-slate-700 dark:text-slate-300'>
                    {r.address}
                  </p>
                </div>
              )}
              {r.notes && (
                <div>
                  <Label icon='notes'>Notas / Observaciones</Label>
                  <p className='mt-1 text-sm whitespace-pre-wrap text-slate-600 dark:text-slate-400'>
                    {r.notes}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Equipment list ── */}
          {r.equipmentItems.length > 0 && (
            <div className='border-b border-slate-100 px-6 py-5 dark:border-slate-800'>
              <Label icon='videocam'>Equipo Asignado</Label>
              <div className='mt-3 overflow-hidden rounded-xl border border-slate-100 dark:border-slate-700'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='bg-slate-50 dark:bg-slate-800/60'>
                      <th
                        className='px-4 py-2.5 text-left text-xs font-bold tracking-wider text-slate-500 uppercase'
                        colSpan={2}
                      >
                        Artículo
                      </th>
                      <th className='px-4 py-2.5 text-right text-xs font-bold tracking-wider text-slate-500 uppercase'>
                        Cant.
                      </th>
                      <th className='px-4 py-2.5 text-right text-xs font-bold tracking-wider text-slate-500 uppercase'>
                        Tarifa/día
                      </th>
                      {multiDay && (
                        <th className='px-4 py-2.5 text-right text-xs font-bold tracking-wider text-slate-500 uppercase'>
                          Días
                        </th>
                      )}
                      <th className='px-4 py-2.5 text-right text-xs font-bold tracking-wider text-slate-500 uppercase'>
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.equipmentItems.map((item, idx) => (
                      <tr
                        key={item.equipmentId}
                        className={`border-t border-slate-50 dark:border-slate-700 ${idx % 2 === 1 ? 'bg-slate-50/50 dark:bg-slate-800/20' : ''}`}
                      >
                        <td className='w-10 py-2.5 pr-2 pl-4'>
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className='h-9 w-9 rounded-lg border border-slate-100 object-cover'
                            />
                          ) : (
                            <div className='flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700'>
                              <span className='material-symbols-outlined text-[16px] font-normal text-slate-400'>
                                videocam
                              </span>
                            </div>
                          )}
                        </td>
                        <td className='py-2.5 pr-4 font-medium text-slate-800 dark:text-slate-200'>
                          {item.name}
                        </td>
                        <td className='py-2.5 pr-4 text-right text-slate-600 tabular-nums dark:text-slate-400'>
                          ×{item.quantity}
                        </td>
                        <td className='py-2.5 pr-4 text-right text-slate-600 tabular-nums dark:text-slate-400'>
                          {item.daily_rate > 0 ? fmt(item.daily_rate) : '—'}
                        </td>
                        {multiDay && (
                          <td className='py-2.5 pr-4 text-right text-slate-600 tabular-nums dark:text-slate-400'>
                            ×{days}
                          </td>
                        )}
                        <td className='py-2.5 pr-4 text-right font-bold text-slate-700 tabular-nums dark:text-slate-300'>
                          {item.daily_rate > 0
                            ? fmt(item.quantity * item.daily_rate * days)
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Financial summary ── */}
          <div className='border-b border-slate-100 px-6 py-5 dark:border-slate-800'>
            <Label icon='receipt_long'>Resumen Financiero</Label>
            <div className='mt-3 space-y-1.5 text-sm'>
              {equipmentTotal > 0 && (
                <div className='flex justify-between text-slate-600 dark:text-slate-400'>
                  <span>{multiDay ? `Equipo × ${days} días` : 'Equipo'}</span>
                  <span className='font-semibold text-slate-800 tabular-nums dark:text-slate-200'>
                    {fmt(equipmentTotal)}
                  </span>
                </div>
              )}
              {r.requiresInvoice && (
                <div className='flex justify-between text-slate-600 dark:text-slate-400'>
                  <span>IVA (16%)</span>
                  <span className='font-semibold text-slate-800 tabular-nums dark:text-slate-200'>
                    {fmt(iva)}
                  </span>
                </div>
              )}
              <div className='flex items-center justify-between rounded-xl bg-[#2d3748] px-4 py-3 text-white'>
                <span className='font-bold'>Total</span>
                <span className='text-lg font-extrabold tabular-nums'>
                  {fmt(total)}
                </span>
              </div>
            </div>
          </div>

          {/* ── Abrir documento PDF ── */}
          <div className='mt-4 flex justify-center'>
            <button
              onClick={() => openReservationDocument(r)}
              className='flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition-all hover:border-[#2d3748] hover:bg-[#2d3748] hover:text-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:bg-slate-700'
            >
              <span className='material-symbols-outlined text-[15px] font-normal'>
                picture_as_pdf
              </span>
              Abrir documento PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Micro-components ─────────────────────────────────────────────────────────

function InfoBlock({
  icon,
  label,
  value,
}: {
  icon: string
  label: string
  value: string
}) {
  return (
    <div>
      <div className='mb-1 flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-slate-400 uppercase'>
        <span className='material-symbols-outlined text-[13px] font-normal'>
          {icon}
        </span>
        {label}
      </div>
      <p className='text-sm font-semibold text-slate-800 dark:text-slate-200'>
        {value}
      </p>
    </div>
  )
}

function Label({
  icon,
  children,
}: {
  icon: string
  children: React.ReactNode
}) {
  return (
    <div className='flex items-center gap-2 text-xs font-bold tracking-wider text-slate-500 uppercase'>
      <span className='material-symbols-outlined text-[14px] font-normal text-[#2d3748]'>
        {icon}
      </span>
      {children}
    </div>
  )
}
