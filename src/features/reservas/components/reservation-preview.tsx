import type { ReservationFormValues } from '../types'
import { formatLocalDate } from '@/utils/date-utils'

interface ReservationPreviewProps {
  values: ReservationFormValues
}

// ─── Helpers ──────────────────────────────────────────────────────────────────


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

function calcHours(start: string, end: string): number {
  if (!start || !end) return 0
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return Math.max(0, (eh * 60 + em - (sh * 60 + sm)) / 60)
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Renders a live booking document preview modelled after a professional invoice.
 *
 * Layout (mirrors the reference design):
 *  - Top bar:   Studio logo / name  +  "BOOKING" large label  +  doc number / date
 *  - Info row:  BILL TO (client info)  |  PROJECT DETAILS (dates, location, type)
 *  - Table:     DESCRIPTION / QTY·DAYS / UNIT PRICE / TOTAL
 *  - Totals:    Subtotal → IVA → dark TOTAL bar
 *  - Notes:     If any
 */
export function ReservationPreview({ values }: ReservationPreviewProps) {
  const days = calcDays(values.date, values.endDate)
  const hours = calcHours(values.startTime, values.endTime)
  const multiDay = days > 1

  const equipmentSubtotal = values.equipmentItems.reduce(
    (acc, item) => acc + item.quantity * item.daily_rate * days,
    0
  )
  const iva = values.requiresInvoice ? equipmentSubtotal * 0.16 : 0
  const total = equipmentSubtotal + iva

  const fmtMXN = (n: number) =>
    n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })

  // Draft number placeholder
  const draftNumber = 'R-#####'

  return (
    // Outer wrapper — light gray background matching the reference
    <div className='h-full overflow-y-auto bg-slate-100 p-5 dark:bg-slate-950'>
      {/* ── LIVE DOCUMENT PREVIEW label ── */}

      {/* ── Paper card ── */}
      <div className='mx-auto max-w-[620px] overflow-hidden rounded-xl bg-white shadow-[0_4px_24px_rgba(0,0,0,0.10)] dark:bg-slate-900'>
        {/* ══ HEADER ══════════════════════════════════════════════════════ */}
        <div className='flex items-start justify-between border-b border-slate-100 px-8 py-6 dark:border-slate-800'>
          {/* Studio name */}
          <div>
            <div className='mb-1 flex items-center gap-2'>
              <span className='material-symbols-outlined text-[18px] font-normal text-slate-700 dark:text-slate-300'>
                movie
              </span>
              <span className='text-sm font-extrabold tracking-[0.14em] text-slate-800 uppercase dark:text-slate-100'>
                StudioOS
              </span>
              <span className='text-sm font-light tracking-[0.14em] text-slate-400'>
                Studio
              </span>
            </div>
            <p className='text-[10px] text-slate-400'>estudio@studioos.mx</p>
            <p className='text-[10px] text-slate-400'>
              Guadalajara, Jalisco · MX
            </p>
          </div>

          {/* Document identity */}
          <div className='text-right'>
            <p className='text-[28px] font-black tracking-tight text-slate-200 uppercase dark:text-slate-700'>
              Reserva
            </p>
            <p className='text-xs font-bold text-slate-600 dark:text-slate-400'>
              {draftNumber}
            </p>
            <p className='text-[11px] text-slate-400'>
              {values.date ? formatDate(values.date) : '—'}
            </p>
          </div>
        </div>

        {/* ══ BILL TO + PROJECT DETAILS ════════════════════════════════════ */}
        <div className='grid grid-cols-2 border-b border-slate-100 dark:border-slate-800'>
          {/* Bill to */}
          <div className='border-r border-slate-100 px-8 py-5 dark:border-slate-800'>
            <p className='mb-2 text-[8px] font-black tracking-[0.18em] text-slate-400 uppercase'>
              Reservado por:
            </p>
            <p className='text-sm font-bold text-slate-800 dark:text-slate-100'>
              {values.clientName || <span className='text-slate-300'>—</span>}
            </p>
            {values.address && (
              <p className='mt-0.5 text-[11px] leading-relaxed text-slate-500'>
                {values.address}
              </p>
            )}
          </div>

          {/* Project details */}
          <div className='px-8 py-5'>
            <p className='mb-2 text-[8px] font-black tracking-[0.18em] text-slate-400 uppercase'>
              Detalles
            </p>
            {multiDay ? (
              <>
                <p className='text-sm font-bold text-slate-800 dark:text-slate-100'>
                  {values.date ? formatDate(values.date) : '—'}
                </p>
                <p className='text-[11px] text-slate-500'>
                  al {values.endDate ? formatDate(values.endDate) : '—'} ·{' '}
                  {days} día{days !== 1 ? 's' : ''}
                </p>
              </>
            ) : (
              <>
                <p className='text-sm font-bold text-slate-800 dark:text-slate-100'>
                  {values.date ? formatDate(values.date) : '—'}
                </p>
                {values.startTime && (
                  <p className='text-[11px] text-slate-500'>
                    {fmt24to12(values.date, values.startTime)} – {fmt24to12(values.date, values.endTime)}
                    {hours > 0 && ` · ${hours.toFixed(1)} hrs`}
                  </p>
                )}
              </>
            )}
            {values.requiresInvoice && (
              <p className='mt-1 text-[10px] font-semibold text-amber-600'>
                · Factura requerida (IVA 16%)
              </p>
            )}
          </div>
        </div>

        {/* ══ EQUIPMENT TABLE ══════════════════════════════════════════════ */}
        <div className='px-8 py-5'>
          {/* Table header */}
          <table className='w-full text-xs'>
            <thead>
              <tr className='border-b-2 border-slate-800 dark:border-slate-200'>
                <th
                  className='pb-2 text-left text-[9px] font-black tracking-[0.15em] text-slate-500 uppercase'
                  colSpan={2}
                >
                  Descripción
                </th>
                <th className='pb-2 text-right text-[9px] font-black tracking-[0.15em] text-slate-500 uppercase'>
                  Cant.{multiDay ? '/Días' : ''}
                </th>
                <th className='pb-2 text-right text-[9px] font-black tracking-[0.15em] text-slate-500 uppercase'>
                  Tarifa/día
                </th>
                <th className='pb-2 text-right text-[9px] font-black tracking-[0.15em] text-slate-500 uppercase'>
                  Total
                </th>
              </tr>
            </thead>

            <tbody>
              {values.equipmentItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className='py-8 text-center text-[11px] text-slate-300 dark:text-slate-600'
                  >
                    Sin equipo seleccionado
                  </td>
                </tr>
              ) : (
                values.equipmentItems.map((item) => (
                  <tr
                    key={item.equipmentId}
                    className='border-b border-slate-50 dark:border-slate-800/60'
                  >
                    {/* Thumbnail */}
                    <td className='w-8 py-3 pr-2'>
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className='h-7 w-7 rounded-md object-cover'
                        />
                      ) : (
                        <div className='flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800'>
                          <span className='material-symbols-outlined text-[13px] font-normal text-slate-400'>
                            videocam
                          </span>
                        </div>
                      )}
                    </td>
                    {/* Name */}
                    <td className='py-3 pr-4'>
                      <p className='text-[12px] font-semibold text-slate-800 dark:text-slate-200'>
                        {item.name}
                      </p>
                    </td>
                    {/* Qty × days */}
                    <td className='py-3 pr-4 text-right text-slate-600 tabular-nums dark:text-slate-400'>
                      {multiDay
                        ? `${item.quantity} × ${days}`
                        : `${item.quantity}`}
                    </td>
                    {/* Unit price */}
                    <td className='py-3 pr-4 text-right text-slate-600 tabular-nums dark:text-slate-400'>
                      {item.daily_rate > 0 ? fmtMXN(item.daily_rate) : '—'}
                    </td>
                    {/* Line total */}
                    <td className='py-3 text-right font-bold text-slate-800 tabular-nums dark:text-slate-200'>
                      {item.daily_rate > 0
                        ? fmtMXN(item.quantity * item.daily_rate * days)
                        : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ══ TOTALS ══════════════════════════════════════════════════════ */}
        <div className='border-t border-slate-100 px-8 pt-4 pb-6 dark:border-slate-800'>
          {/* Subtotal row */}
          <div className='flex justify-between py-1 text-[12px] text-slate-500'>
            <span>Subtotal</span>
            <span className='font-semibold text-slate-700 tabular-nums dark:text-slate-300'>
              {fmtMXN(equipmentSubtotal)}
            </span>
          </div>

          {/* IVA row */}
          {values.requiresInvoice && (
            <div className='flex justify-between py-1 text-[12px] text-slate-500'>
              <span>IVA (16%)</span>
              <span className='font-semibold text-slate-700 tabular-nums dark:text-slate-300'>
                {fmtMXN(iva)}
              </span>
            </div>
          )}

          {/* TOTAL bar */}
          <div className='mt-3 flex items-center justify-between rounded-lg bg-slate-800 px-5 py-3 text-white dark:bg-slate-700'>
            <span className='text-[11px] font-black tracking-widest uppercase'>
              Total
            </span>
            <span className='text-xl font-black tabular-nums'>
              {fmtMXN(total)}
            </span>
          </div>
        </div>

        {/* ══ NOTES ══════════════════════════════════════════════════════ */}
        {values.notes && (
          <div className='border-t border-slate-100 px-8 pt-4 pb-7 dark:border-slate-800'>
            <p className='mb-1.5 text-[8px] font-black tracking-[0.18em] text-slate-400 uppercase'>
              Notas
            </p>
            <p className='text-[11px] leading-relaxed whitespace-pre-wrap text-slate-500 dark:text-slate-400'>
              {values.notes}
            </p>
          </div>
        )}

        {/* ══ FOOTER ══════════════════════════════════════════════════════ */}
        <div className='flex items-center justify-between bg-slate-50 px-8 py-3 dark:bg-slate-900/60'>
          <p className='text-[9px] text-slate-400'>
            StudioOS · Orden de Reservación
          </p>
        </div>
      </div>
    </div>
  )
}
