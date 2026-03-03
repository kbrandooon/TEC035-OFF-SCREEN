import { useEffect, useMemo, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { supabase } from '@/supabase/client'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { signOut, useAuth } from '@/features/auth'
import { useEquipmentStats } from '@/features/equipo'
import {
  ReservationFormModal,
  ReservationDetailModal,
  useReservations,
  type Reservation,
  type ReservationFormValues,
} from '@/features/reservas'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewMode = 'mes' | 'semana' | 'dia'

interface Booking {
  id: string
  title: string
  client: string
  startTime: string
  endTime: string
  color: 'blue' | 'purple' | 'emerald' | 'amber' | 'rose'
  status: 'Confirmada' | 'Pendiente' | 'Cancelada'
  day: number // 1-31 (for current month mock data)
  month: number // 0-11
  year: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]
const DAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const DAY_LONG = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
]

/** Formats HH:MM as "HH:MM AM/PM" */
function fmt24to12(t: string) {
  const [h, m] = t.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hh = h % 12 || 12
  return `${hh}:${String(m).padStart(2, '0')} ${suffix}`
}

/** Color token → Tailwind classes for booking chips. */
const COLOR_CHIP: Record<Booking['color'], string> = {
  blue: 'border-blue-200   bg-blue-50   text-blue-800   dark:border-blue-800/50   dark:bg-blue-900/40   dark:text-blue-200',
  purple:
    'border-purple-200 bg-purple-50 text-purple-800 dark:border-purple-800/50 dark:bg-purple-900/40 dark:text-purple-200',
  emerald:
    'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-900/40 dark:text-emerald-200',
  amber:
    'border-amber-200   bg-amber-50   text-amber-800   dark:border-amber-800/50   dark:bg-amber-900/40   dark:text-amber-200',
  rose: 'border-rose-200    bg-rose-50    text-rose-800    dark:border-rose-800/50    dark:bg-rose-900/40    dark:text-rose-200',
}
const COLOR_ACCENT: Record<Booking['color'], string> = {
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
}
const STATUS_CHIP: Record<Booking['status'], string> = {
  Confirmada:
    'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300',
  Pendiente:
    'bg-amber-50   text-amber-600   dark:bg-amber-900/30   dark:text-amber-300',
  Cancelada:
    'bg-red-50     text-red-600     dark:bg-red-900/30     dark:text-red-300',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/**
 * Single booking card shown in the Daily Focus panel.
 * Matches the style from the reference design.
 */
function DayBookingCard({ b, onClick }: { b: Booking; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`group relative flex w-full overflow-hidden rounded-xl border bg-white text-left shadow-sm transition-all duration-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800/60`}
    >
      <div className={`w-1.5 shrink-0 self-stretch ${COLOR_ACCENT[b.color]}`} />
      <div className='flex flex-1 flex-col gap-3 p-5 sm:flex-row sm:items-center'>
        {/* Time */}
        <div className='flex min-w-[110px] flex-col'>
          <span className='text-xl font-light text-slate-900 dark:text-white'>
            {fmt24to12(b.startTime)}
          </span>
          <span className='text-xs font-medium tracking-wider text-slate-400 uppercase'>
            {fmt24to12(b.endTime)}
          </span>
        </div>
        {/* Info */}
        <div className='flex-1'>
          <div className='mb-1.5 flex flex-wrap items-center gap-2'>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wide uppercase ${STATUS_CHIP[b.status]}`}
            >
              {b.status}
            </span>
          </div>
          <h4 className='text-base font-semibold text-slate-800 dark:text-slate-100'>
            {b.title}
          </h4>
          <div className='mt-1.5 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400'>
            <span className='material-symbols-outlined text-[14px] font-normal'>
              person
            </span>
            <span>{b.client}</span>
          </div>
        </div>
      </div>
    </button>
  )
}

/**
 * Daily Focus panel — shown on the right side when a day is selected.
 * Styled to match the reference design.
 *
 * @param date - The selected date.
 * @param bookings - Bookings for this specific day.
 * @param onClose - Callback to deselect the day.
 */
function DailyFocusPanel({
  date,
  bookings,
  onClose,
  onNewReservation,
  onSelectBookingId,
}: {
  date: Date
  bookings: Booking[]
  onClose: () => void
  onNewReservation: (isoDate: string) => void
  onSelectBookingId?: (id: string) => void
}) {
  const dayName = DAY_LONG[date.getDay()]
  const dayNum = date.getDate()
  const monthStr = MONTH_NAMES[date.getMonth()]
  const year = date.getFullYear()

  /** ISO string for this panel's date. */
  const isoDate = `${year}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`

  return (
    <div className='flex w-full flex-col gap-5 xl:w-[420px] xl:shrink-0'>
      {/* Header */}
      <div className='flex items-start justify-between border-b border-slate-200 pb-4 dark:border-slate-700'>
        <div>
          <div className='text-primary mb-0.5 flex items-center gap-2 text-xs font-semibold tracking-widest uppercase'>
            <span className='material-symbols-outlined text-[16px] font-normal'>
              calendar_today
            </span>
            Vista del Día
          </div>
          <h2 className='text-3xl font-light text-slate-900 dark:text-white'>
            {dayName},&nbsp;<span className='font-semibold'>{dayNum}</span>
          </h2>
          <p className='text-sm text-slate-400'>
            {monthStr} {year}
          </p>
        </div>
        <button
          onClick={onClose}
          className='mt-1 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700'
        >
          <span className='material-symbols-outlined text-[20px] font-normal'>
            close
          </span>
        </button>
      </div>

      {/* Bookings */}
      {bookings.length === 0 ? (
        <div className='flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-200 py-10 text-slate-400 dark:border-slate-700'>
          <span className='material-symbols-outlined text-[36px] font-normal'>
            event_busy
          </span>
          <p className='text-sm font-medium'>Sin reservas para este día</p>
        </div>
      ) : (
        <div className='flex flex-col gap-3'>
          {bookings.map((b) => (
            <DayBookingCard
              key={b.id}
              b={b}
              onClick={() => onSelectBookingId?.(b.id)}
            />
          ))}
        </div>
      )}

      {/* Add booking CTA */}
      <button
        onClick={() => onNewReservation(isoDate)}
        className='hover:border-primary/40 hover:text-primary flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-3.5 text-sm font-semibold text-slate-400 transition-all dark:border-slate-700'
      >
        <span className='material-symbols-outlined text-[18px] font-normal'>
          add_circle
        </span>
        Nueva Reserva para este día
      </button>
    </div>
  )
}

/**
 * Month view grid. Clicking a valid day sets it as selected.
 */
function MonthView({
  year,
  month,
  bookings,
  selectedDay,
  onSelectDay,
}: {
  year: number
  month: number
  bookings: Booking[]
  selectedDay: number | null
  onSelectDay: (d: number) => void
}) {
  const firstDow = new Date(year, month, 1).getDay() // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevDays = new Date(year, month, 0).getDate() // days in prev month
  const today = new Date()
  const isThisMonth = today.getFullYear() === year && today.getMonth() === month

  /** Booking counts per day for dot indicators. */
  const countByDay = useMemo(() => {
    const map: Record<number, number> = {}
    bookings.forEach((b) => {
      map[b.day] = (map[b.day] ?? 0) + 1
    })
    return map
  }, [bookings])

  // Cells: prev-month fillers + current month + next-month fillers
  const cells: { day: number; cur: boolean }[] = []
  for (let i = firstDow - 1; i >= 0; i--)
    cells.push({ day: prevDays - i, cur: false })
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, cur: true })
  while (cells.length % 7 !== 0)
    cells.push({ day: cells.length - daysInMonth - firstDow + 1, cur: false })

  const rows = Math.ceil(cells.length / 7)

  return (
    <div>
      {/* Weekday headers */}
      <div className='mb-2 grid grid-cols-7 gap-px'>
        {DAY_SHORT.map((d) => (
          <div
            key={d}
            className='py-2 text-center text-[11px] font-bold tracking-widest text-slate-400 uppercase'
          >
            {d}
          </div>
        ))}
      </div>
      {/* Day grid */}
      <div
        className={`grid grid-cols-7 gap-2`}
        style={{ gridTemplateRows: `repeat(${rows}, minmax(90px,1fr))` }}
      >
        {cells.map(({ day, cur }, idx) => {
          if (!cur) {
            return (
              <div
                key={`filler-${idx}`}
                className='min-h-[90px] rounded-lg p-2'
              >
                <span className='text-sm font-medium text-slate-300 dark:text-slate-700'>
                  {day}
                </span>
              </div>
            )
          }
          const isToday = isThisMonth && day === today.getDate()
          const isSelected = day === selectedDay
          const bookingsForDay = bookings.filter((b) => b.day === day)

          return (
            <div
              key={`day-${day}`}
              onClick={() => onSelectDay(day)}
              className={[
                'group relative min-h-[90px] cursor-pointer rounded-lg border p-2 shadow-sm transition-all duration-200',
                isSelected
                  ? 'border-primary/60 bg-primary/5 dark:bg-primary/10 shadow-md'
                  : 'border-slate-200 bg-white hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-500',
              ].join(' ')}
            >
              {/* Day number */}
              {isToday ? (
                <span className='bg-primary flex size-6 items-center justify-center rounded-full text-sm font-bold text-white shadow'>
                  {day}
                </span>
              ) : (
                <span
                  className={`text-sm font-medium transition-colors ${isSelected ? 'text-primary font-bold' : 'group-hover:text-primary text-slate-700 dark:text-slate-300'}`}
                >
                  {day}
                </span>
              )}
              {/* Event chips */}
              <div className='mt-1.5 flex flex-col gap-1'>
                {bookingsForDay.slice(0, 2).map((b) => (
                  <div
                    key={b.id}
                    className={`truncate rounded border px-1.5 py-0.5 text-[11px] font-semibold ${COLOR_CHIP[b.color]}`}
                  >
                    {b.title}
                  </div>
                ))}
                {bookingsForDay.length > 2 && (
                  <div className='px-1 text-[10px] font-bold text-slate-400'>
                    +{bookingsForDay.length - 2} más
                  </div>
                )}
              </div>
              {/* Dot if has bookings and none shown */}
              {countByDay[day] > 0 && bookingsForDay.length === 0 && (
                <div className='bg-primary absolute bottom-2 left-1/2 size-1.5 -translate-x-1/2 rounded-full' />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Week view: 7 column grid showing events in time-blocks.
 */
function WeekView({
  year,
  month,
  weekStart,
  bookings,
  selectedDay,
  onSelectDay,
}: {
  year: number
  month: number
  weekStart: Date
  bookings: Booking[]
  selectedDay: number | null
  onSelectDay: (d: number) => void
}) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })
  const today = new Date()

  return (
    <div>
      <div className='grid grid-cols-7 gap-2'>
        {days.map((day) => {
          const d = day.getDate()
          const m = day.getMonth()
          const y = day.getFullYear()
          const isToday =
            today.getDate() === d &&
            today.getMonth() === m &&
            today.getFullYear() === y
          const isSelected = d === selectedDay && m === month && y === year
          const dayBookings = bookings.filter(
            (b) => b.day === d && b.month === m && b.year === y
          )
          const isCurrentMonth = m === month && y === year

          return (
            <div
              key={day.toISOString()}
              onClick={() => isCurrentMonth && onSelectDay(d)}
              className={[
                'min-h-[200px] cursor-pointer rounded-xl border p-3 transition-all',
                isSelected
                  ? 'border-primary/60 bg-primary/5 dark:bg-primary/10 shadow-md'
                  : isCurrentMonth
                    ? 'border-slate-200 bg-white hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800'
                    : 'border-slate-100 bg-slate-50/50 opacity-50 dark:border-slate-800 dark:bg-slate-900/20',
              ].join(' ')}
            >
              {/* Header */}
              <div className='mb-3 flex flex-col items-center'>
                <span className='text-[10px] font-bold tracking-wider text-slate-400 uppercase'>
                  {DAY_SHORT[day.getDay()]}
                </span>
                {isToday ? (
                  <span className='bg-primary mt-0.5 flex size-7 items-center justify-center rounded-full text-sm font-bold text-white shadow'>
                    {d}
                  </span>
                ) : (
                  <span
                    className={`mt-0.5 text-sm font-semibold ${isSelected ? 'text-primary' : 'text-slate-700 dark:text-slate-200'}`}
                  >
                    {d}
                  </span>
                )}
              </div>
              {/* Bookings */}
              <div className='flex flex-col gap-1.5'>
                {dayBookings.map((b) => (
                  <div
                    key={b.id}
                    className={`rounded-lg border px-2 py-1.5 text-[11px] leading-tight font-semibold ${COLOR_CHIP[b.color]}`}
                  >
                    <div className='truncate'>{b.title}</div>
                    <div className='mt-0.5 font-normal opacity-70'>
                      {b.startTime}
                    </div>
                  </div>
                ))}
                {dayBookings.length === 0 && isCurrentMonth && (
                  <div className='flex items-center justify-center py-4 text-slate-300 dark:text-slate-700'>
                    <span className='material-symbols-outlined text-[20px] font-normal'>
                      horizontal_rule
                    </span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
      <p className='mt-3 text-center text-xs text-slate-400'>
        Vista semanal — haz clic en un día para ver el detalle
      </p>
    </div>
  )
}

/**
 * Day view: hour-by-hour timeline for the selected day.
 */
function DayView({
  bookings,
  onSelectBookingId,
}: {
  date: Date
  bookings: Booking[]
  onSelectBookingId?: (id: string) => void
}) {
  const START_HOUR = 7
  const END_HOUR = 20
  const ROW_HEIGHT = 64 // px per hour
  const hours = Array.from(
    { length: END_HOUR - START_HOUR },
    (_, i) => i + START_HOUR
  )

  /** Convert "HH:MM" → fractional hours from START_HOUR (clamped). */
  function toOffset(time: string): number {
    if (!time) return 0
    const [h, m] = time.split(':').map(Number)
    return Math.max(0, Math.min(h + m / 60 - START_HOUR, END_HOUR - START_HOUR))
  }

  return (
    <div className='relative flex'>
      {/* Hour labels column */}
      <div className='w-14 shrink-0'>
        {hours.map((h) => (
          <div
            key={h}
            style={{ height: ROW_HEIGHT }}
            className='flex items-start justify-end pt-1 pr-3 text-xs font-medium text-slate-400'
          >
            {`${String(h).padStart(2, '0')}:00`}
          </div>
        ))}
      </div>

      {/* Timeline grid + events */}
      <div
        className='relative flex-1'
        style={{ height: (END_HOUR - START_HOUR) * ROW_HEIGHT }}
      >
        {/* Hour grid lines */}
        {hours.map((h, i) => (
          <div
            key={h}
            className='absolute inset-x-0 border-b border-slate-100 dark:border-slate-800'
            style={{ top: i * ROW_HEIGHT, height: ROW_HEIGHT }}
          />
        ))}

        {/* Absolutely-positioned event blocks */}
        {bookings.map((b) => {
          const topOffset = toOffset(b.startTime)
          const botOffset = toOffset(b.endTime)
          const height = Math.max(botOffset - topOffset, 0.5) // min 30px
          const top = topOffset * ROW_HEIGHT
          const blockH = height * ROW_HEIGHT - 4 // 2px gap each side

          return (
            <button
              key={b.id}
              onClick={() => onSelectBookingId?.(b.id)}
              className={`absolute right-1 left-1 overflow-hidden rounded-lg border px-3 py-1.5 text-left shadow-sm transition-shadow hover:shadow-md ${COLOR_CHIP[b.color]}`}
              style={{ top: top + 2, height: blockH }}
            >
              <p className='truncate text-xs font-bold'>
                {fmt24to12(b.startTime)} – {fmt24to12(b.endTime)}
              </p>
              <p className='truncate text-xs font-semibold'>{b.title}</p>
              {blockH > 40 && b.client && (
                <p className='truncate text-[11px] opacity-70'>{b.client}</p>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function DashboardPage() {
  const navigate = useNavigate()
  const { session, user, isLoading } = useAuth()

  // Onboarding state
  const [studioName, setStudioName] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [isCreatingTenant, setIsCreatingTenant] = useState(false)
  const [onboardError, setOnboardError] = useState<string | null>(null)

  // Calendar state
  const today = new Date()
  const [viewMode, setViewMode] = useState<ViewMode>('mes')
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth()) // 0-indexed
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  // Week view: which week is shown (first day of that week)
  const [weekStart, setWeekStart] = useState<Date>(() => {
    const d = new Date(today)
    d.setDate(today.getDate() - today.getDay()) // start of current week (Sun)
    d.setHours(0, 0, 0, 0)
    return d
  })

  // ── Reservation modal state ──────────────────────────────────────────────────
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false)
  const [reservationInitialDate, setReservationInitialDate] = useState<
    string | undefined
  >()
  const [isSavingReservation, setIsSavingReservation] = useState(false)
  const [reservationError, setReservationError] = useState<string | null>(null)
  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | null>(null)
  const [editingReservation, setEditingReservation] =
    useState<Reservation | null>(null)
  const {
    onCreate: createReservation,
    onUpdate: updateReservation,
    onUpdateStatus,
    onDelete,
    reservations,
    isLoading: reservationsLoading,
  } = useReservations()

  const openReservationModal = (isoDate?: string) => {
    setEditingReservation(null)
    setReservationInitialDate(isoDate)
    setReservationError(null)
    setIsReservationModalOpen(true)
  }

  /** Opens the form modal pre-filled for editing. */
  const openEditModal = (reservation: Reservation) => {
    setEditingReservation(reservation)
    setReservationInitialDate(undefined)
    setReservationError(null)
    setIsReservationModalOpen(true)
  }

  const handleSaveReservation = async (values: ReservationFormValues) => {
    setIsSavingReservation(true)
    setReservationError(null)
    try {
      if (editingReservation) {
        await updateReservation(editingReservation.id, values)
      } else {
        await createReservation(values)
      }
      setIsReservationModalOpen(false)
      setEditingReservation(null)
    } catch (err) {
      setReservationError(
        err instanceof Error ? err.message : 'Error al guardar la reserva.'
      )
    } finally {
      setIsSavingReservation(false)
    }
  }

  useEffect(() => {
    if (!isLoading && !user) void navigate({ to: '/' })
  }, [isLoading, user, navigate])

  // Live inventory stats for the sidebar widget
  const { stats: equipStats, isLoading: statsLoading } = useEquipmentStats()

  const handleSignOut = async () => {
    await signOut()
    navigate({ to: '/' })
  }

  const handleCreateStudio = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreatingTenant(true)
    setOnboardError(null)
    try {
      const { error } = await supabase.rpc('create_new_tenant_with_admin', {
        p_tenant_name: studioName,
        p_first_name: firstName,
        p_last_name: lastName,
      })
      if (error) throw new Error(error.message)
      await supabase.auth.refreshSession()
      window.location.reload()
    } catch (err) {
      setOnboardError(
        err instanceof Error ? err.message : 'Error al crear tu estudio.'
      )
      setIsCreatingTenant(false)
    }
  }

  const jwtClaims = session?.user?.app_metadata || {}

  if (isLoading || !user) return null

  // ── Onboarding ──────────────────────────────────────────────────────────────
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
            <form
              className='space-y-6'
              onSubmit={(e) => void handleCreateStudio(e)}
            >
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
                    required
                    value={studioName}
                    onChange={(e) => setStudioName(e.target.value)}
                    disabled={isCreatingTenant}
                    className='block w-full rounded-lg border border-slate-300 px-3 py-3 placeholder-slate-400 shadow-sm focus:border-slate-500 focus:ring-slate-500 focus:outline-none sm:text-sm'
                    placeholder='Ej. Cinematik Rentals'
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
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      disabled={isCreatingTenant}
                      className='block w-full rounded-lg border border-slate-300 px-3 py-3 placeholder-slate-400 shadow-sm focus:border-slate-500 focus:ring-slate-500 focus:outline-none sm:text-sm'
                      placeholder='John'
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
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      disabled={isCreatingTenant}
                      className='block w-full rounded-lg border border-slate-300 px-3 py-3 placeholder-slate-400 shadow-sm focus:border-slate-500 focus:ring-slate-500 focus:outline-none sm:text-sm'
                      placeholder='Doe'
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
                  className='bg-primary hover:bg-primary-hover flex w-full justify-center rounded-lg border border-transparent px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors disabled:opacity-70'
                >
                  {isCreatingTenant
                    ? 'Configurando todo...'
                    : 'Comenzar a usar Off Screen'}
                </button>
                <button
                  type='button'
                  onClick={() => void handleSignOut()}
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

  // ── Calendar helpers ─────────────────────────────────────────────────────────

  const monthLabel = `${MONTH_NAMES[calMonth]} ${calYear}`

  const navigatePrev = () => {
    if (viewMode === 'mes') {
      if (calMonth === 0) {
        setCalMonth(11)
        setCalYear((y) => y - 1)
      } else setCalMonth((m) => m - 1)
      setSelectedDay(null)
    } else if (viewMode === 'semana') {
      setWeekStart((prev) => {
        const d = new Date(prev)
        d.setDate(d.getDate() - 7)
        return d
      })
    } else {
      setSelectedDay((prev) => (prev != null && prev > 1 ? prev - 1 : prev))
    }
  }
  const navigateNext = () => {
    if (viewMode === 'mes') {
      if (calMonth === 11) {
        setCalMonth(0)
        setCalYear((y) => y + 1)
      } else setCalMonth((m) => m + 1)
      setSelectedDay(null)
    } else if (viewMode === 'semana') {
      setWeekStart((prev) => {
        const d = new Date(prev)
        d.setDate(d.getDate() + 7)
        return d
      })
    } else {
      const lastDay = new Date(calYear, calMonth + 1, 0).getDate()
      setSelectedDay((prev) =>
        prev != null && prev < lastDay ? prev + 1 : prev
      )
    }
  }
  const goToToday = () => {
    setCalYear(today.getFullYear())
    setCalMonth(today.getMonth())
    setSelectedDay(today.getDate())
    const ws = new Date(today)
    ws.setDate(today.getDate() - today.getDay())
    ws.setHours(0, 0, 0, 0)
    setWeekStart(ws)
  }

  // Map real reservations → internal Booking shape used by calendar views
  const COLORS: Booking['color'][] = [
    'blue',
    'purple',
    'emerald',
    'amber',
    'rose',
  ]
  const liveBookings: Booking[] = reservations.map((r, i) => {
    const [y, m, d] = r.date.split('-').map(Number)
    return {
      id: r.id,
      title: r.clientName || 'Reserva',
      client: r.clientName || '',
      startTime: r.startTime || '00:00',
      endTime: r.endTime || '00:00',
      color: COLORS[i % COLORS.length],
      status:
        r.status === 'confirmed'
          ? 'Confirmada'
          : r.status === 'canceled'
            ? 'Cancelada'
            : 'Pendiente',
      day: d,
      month: m - 1, // JS months are 0-indexed
      year: y,
    }
  })

  // Filter bookings for the current displayed month
  const visibleBookings = liveBookings.filter(
    (b) => b.month === calMonth && b.year === calYear
  )
  const selectedDayBookings =
    selectedDay != null
      ? visibleBookings.filter((b) => b.day === selectedDay)
      : []
  const selectedDate =
    selectedDay != null ? new Date(calYear, calMonth, selectedDay) : null

  // Week label
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  const weekLabel = `${weekStart.getDate()} ${MONTH_NAMES[weekStart.getMonth()].slice(0, 3)} – ${weekEnd.getDate()} ${MONTH_NAMES[weekEnd.getMonth()].slice(0, 3)} ${weekEnd.getFullYear()}`

  const headerLabel =
    viewMode === 'mes'
      ? monthLabel
      : viewMode === 'semana'
        ? weekLabel
        : selectedDate
          ? `${selectedDate.getDate()} ${MONTH_NAMES[calMonth]} ${calYear}`
          : monthLabel

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      {/* Page header */}
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <div>
          <h3 className='text-2xl font-bold tracking-tight text-slate-800 dark:text-white'>
            Reservas
          </h3>
          <p className='mt-1 text-sm text-slate-500 dark:text-slate-400'>
            Gestiona la disponibilidad del estudio y reservas de equipo.
          </p>
        </div>
        <button
          onClick={() => openReservationModal()}
          className='bg-primary hover:bg-primary-hover flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow transition-all hover:shadow-md active:scale-[0.98]'
        >
          <span className='material-symbols-outlined text-[18px] font-normal'>
            add
          </span>
          Nueva Reserva
        </button>
      </div>

      {/* Main two-column layout */}
      <div className='flex flex-col gap-6 xl:flex-row xl:items-start'>
        {/* Calendar panel */}
        <div className='flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800/60'>
          {/* Toolbar */}
          <div className='flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4 dark:border-slate-700'>
            {/* Nav arrows + label */}
            <div className='flex items-center gap-3'>
              <div className='flex overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700'>
                <button
                  onClick={navigatePrev}
                  className='px-2.5 py-1.5 text-slate-500 transition-colors hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700'
                >
                  <span className='material-symbols-outlined text-[18px] font-normal'>
                    chevron_left
                  </span>
                </button>
                <button
                  onClick={navigateNext}
                  className='border-l border-slate-200 px-2.5 py-1.5 text-slate-500 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700'
                >
                  <span className='material-symbols-outlined text-[18px] font-normal'>
                    chevron_right
                  </span>
                </button>
              </div>
              <h4 className='text-base font-bold text-slate-800 capitalize dark:text-white'>
                {headerLabel}
              </h4>
            </div>

            {/* View switcher + Today */}
            <div className='flex items-center gap-2'>
              <button
                onClick={goToToday}
                className='rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'
              >
                Hoy
              </button>
              <div className='flex overflow-hidden rounded-lg border border-slate-200 text-xs font-semibold dark:border-slate-700'>
                {(['mes', 'semana', 'dia'] as ViewMode[]).map((v, i) => (
                  <button
                    key={v}
                    onClick={() => {
                      setViewMode(v)
                      if (v === 'dia' && !selectedDay)
                        setSelectedDay(today.getDate())
                    }}
                    className={[
                      'px-3.5 py-1.5 capitalize transition-colors',
                      i > 0
                        ? 'border-l border-slate-200 dark:border-slate-700'
                        : '',
                      viewMode === v
                        ? 'bg-primary text-white shadow-inner'
                        : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700',
                    ].join(' ')}
                  >
                    {v === 'mes' ? 'Mes' : v === 'semana' ? 'Semana' : 'Día'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Calendar body */}
          <div className='p-4'>
            {viewMode === 'mes' && (
              <MonthView
                year={calYear}
                month={calMonth}
                bookings={visibleBookings}
                selectedDay={selectedDay}
                onSelectDay={setSelectedDay}
              />
            )}
            {viewMode === 'semana' && (
              <WeekView
                year={calYear}
                month={calMonth}
                weekStart={weekStart}
                bookings={liveBookings}
                selectedDay={selectedDay}
                onSelectDay={setSelectedDay}
              />
            )}
            {viewMode === 'dia' && selectedDate && (
              <DayView
                date={selectedDate}
                bookings={selectedDayBookings}
                onSelectBookingId={(id) => {
                  const r = reservations.find((res) => res.id === id)
                  if (r) setSelectedReservation(r)
                }}
              />
            )}
          </div>
        </div>

        {/* Right side: daily focus panel OR sidebar stats */}
        {selectedDay != null && viewMode !== 'dia' ? (
          <DailyFocusPanel
            date={new Date(calYear, calMonth, selectedDay)}
            bookings={selectedDayBookings}
            onClose={() => setSelectedDay(null)}
            onNewReservation={openReservationModal}
            onSelectBookingId={(id) => {
              const r = reservations.find((res) => res.id === id)
              if (r) setSelectedReservation(r)
            }}
          />
        ) : (
          <div className='flex w-full flex-col gap-5 xl:w-96 xl:shrink-0'>
            {/* Upcoming bookings */}
            <div className='rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800/60'>
              <h4 className='mb-4 flex items-center gap-2 text-sm font-bold tracking-wide text-slate-800 uppercase dark:text-white'>
                <span className='material-symbols-outlined text-primary font-normal'>
                  event_upcoming
                </span>
                Próximas Reservas
              </h4>
              <div className='flex flex-col gap-3'>
                {reservationsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className='flex animate-pulse gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3.5 dark:border-slate-700 dark:bg-slate-800/30'
                    >
                      <div className='size-12 shrink-0 rounded-lg bg-slate-200 dark:bg-slate-700' />
                      <div className='flex-1 space-y-2 py-1'>
                        <div className='h-3 w-3/4 rounded bg-slate-200 dark:bg-slate-700' />
                        <div className='h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-700' />
                      </div>
                    </div>
                  ))
                ) : reservations.length === 0 ? (
                  <div className='flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-8 text-slate-400 dark:border-slate-700'>
                    <span className='material-symbols-outlined text-[32px] font-normal'>
                      event_busy
                    </span>
                    <p className='text-sm font-medium'>
                      Sin reservas registradas
                    </p>
                  </div>
                ) : (
                  [...reservations]
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .slice(0, 5)
                    .map((r) => {
                      const [y, m, d] = r.date.split('-').map(Number)
                      return (
                        <button
                          key={r.id}
                          onClick={() => setSelectedReservation(r)}
                          className='flex w-full items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3.5 text-left transition-all hover:border-slate-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800/30 dark:hover:border-slate-500'
                        >
                          {/* Date badge */}
                          <div className='flex size-12 shrink-0 flex-col items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-600 dark:bg-slate-800'>
                            <span className='text-[10px] font-bold text-slate-400 uppercase'>
                              {MONTH_NAMES[m - 1].slice(0, 3)}
                            </span>
                            <span className='text-lg font-bold text-slate-800 dark:text-white'>
                              {String(d).padStart(2, '0')}
                            </span>
                          </div>
                          {/* Info */}
                          <div className='min-w-0 flex-1'>
                            <p className='truncate text-sm font-bold text-slate-800 dark:text-white'>
                              {r.clientName || 'Cliente'}
                            </p>
                            <p className='mt-0.5 text-xs text-slate-500 dark:text-slate-400'>
                              {r.startTime
                                ? `${fmt24to12(r.startTime)} – ${fmt24to12(r.endTime)}`
                                : `${String(d).padStart(2, '0')} ${MONTH_NAMES[m - 1]} ${y}`}
                            </p>
                            {r.address && (
                              <p className='mt-0.5 truncate text-xs text-slate-400 dark:text-slate-500'>
                                {r.address}
                              </p>
                            )}
                            {/* Status badge */}
                            <span
                              className={`mt-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${
                                r.status === 'confirmed'
                                  ? 'bg-emerald-50 text-emerald-600'
                                  : r.status === 'canceled'
                                    ? 'bg-red-50 text-red-600'
                                    : 'bg-amber-50 text-amber-600'
                              }`}
                            >
                              {r.status === 'confirmed'
                                ? 'Confirmada'
                                : r.status === 'canceled'
                                  ? 'Cancelada'
                                  : 'Pendiente'}
                            </span>
                          </div>
                        </button>
                      )
                    })
                )}
              </div>
            </div>

            {/* Inventory status - live data from equipment table */}
            <div className='relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 p-5 text-white shadow-lg'>
              <div className='absolute -top-4 -right-4 opacity-5'>
                <span className='material-symbols-outlined text-[120px] font-normal'>
                  videocam
                </span>
              </div>
              <h4 className='relative z-10 mb-0.5 text-sm font-bold tracking-wide uppercase'>
                Status de Inventario
              </h4>
              <p className='relative z-10 mb-4 text-xs font-medium text-slate-400'>
                Disponibilidad en tiempo real
              </p>
              <div className='relative z-10 space-y-3.5'>
                {statsLoading ? (
                  // Loading skeleton rows
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className='animate-pulse'>
                      <div className='mb-1.5 flex items-center justify-between'>
                        <div className='h-3 w-24 rounded bg-slate-700' />
                        <div className='h-3 w-10 rounded bg-slate-700' />
                      </div>
                      <div className='h-1.5 w-full rounded-full bg-slate-700' />
                    </div>
                  ))
                ) : equipStats.length === 0 ? (
                  <p className='text-center text-xs text-slate-500'>
                    Sin equipo registrado aún.
                  </p>
                ) : (
                  equipStats.map((stat) => {
                    // Map EquipmentType → icon + color
                    const META: Record<
                      string,
                      { icon: string; bar: string; txt: string }
                    > = {
                      camara: {
                        icon: 'photo_camera',
                        bar: 'bg-emerald-500',
                        txt: 'text-emerald-400',
                      },
                      lente: {
                        icon: 'camera',
                        bar: 'bg-emerald-500',
                        txt: 'text-emerald-400',
                      },
                      iluminacion: {
                        icon: 'lightbulb',
                        bar: 'bg-amber-500',
                        txt: 'text-amber-400',
                      },
                      tramoya: {
                        icon: 'settings_input_component',
                        bar: 'bg-emerald-500',
                        txt: 'text-emerald-400',
                      },
                      audio: {
                        icon: 'mic',
                        bar: 'bg-emerald-500',
                        txt: 'text-emerald-400',
                      },
                      video: {
                        icon: 'videocam',
                        bar: 'bg-amber-500',
                        txt: 'text-amber-400',
                      },
                      estudio: {
                        icon: 'meeting_room',
                        bar: 'bg-emerald-500',
                        txt: 'text-emerald-400',
                      },
                      otros_accesorios: {
                        icon: 'category',
                        bar: 'bg-blue-500',
                        txt: 'text-blue-400',
                      },
                    }
                    const LABELS: Record<string, string> = {
                      camara: 'Cámara',
                      lente: 'Lente',
                      iluminacion: 'Iluminación',
                      tramoya: 'Tramoya',
                      audio: 'Audio',
                      video: 'Video',
                      estudio: 'Estudio',
                      otros_accesorios: 'Otros / Accesorios',
                    }
                    const { icon, bar, txt } = META[stat.type] ?? {
                      icon: 'category',
                      bar: 'bg-blue-500',
                      txt: 'text-blue-400',
                    }
                    const pct =
                      stat.total > 0 ? (stat.available / stat.total) * 100 : 0
                    // Amber when less than 50% available
                    const barColor = pct < 50 ? 'bg-amber-500' : bar
                    const txtColor = pct < 50 ? 'text-amber-400' : txt

                    return (
                      <div key={stat.type}>
                        <div className='mb-1 flex items-center justify-between text-xs'>
                          <span className='flex items-center gap-1.5 font-medium text-slate-300'>
                            <span className='material-symbols-outlined text-[13px] font-normal text-slate-500'>
                              {icon}
                            </span>
                            {LABELS[stat.type] ?? stat.type}
                          </span>
                          <span
                            className={`font-bold tabular-nums ${txtColor}`}
                          >
                            {stat.available}/{stat.total}
                          </span>
                        </div>
                        <div className='h-1.5 w-full rounded-full bg-slate-700/50'>
                          <div
                            className={`h-1.5 rounded-full transition-all ${barColor}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Reservation form modal */}
      {/* key forces a remount when switching create ↔ edit so the lazy */}
      {/* useState initializer in ReservationFormModal re-runs cleanly.  */}
      <ReservationFormModal
        key={editingReservation?.id ?? 'new'}
        isOpen={isReservationModalOpen}
        isSaving={isSavingReservation}
        initialDate={reservationInitialDate}
        reservation={editingReservation}
        error={reservationError}
        onClose={() => {
          setIsReservationModalOpen(false)
          setEditingReservation(null)
        }}
        onSave={(values) => handleSaveReservation(values)}
      />
      {/* Reservation detail modal */}
      <ReservationDetailModal
        reservation={selectedReservation}
        onClose={() => setSelectedReservation(null)}
        onUpdateStatus={async (id, status) => {
          await onUpdateStatus(id, status)
          // Keep selectedReservation in sync after update
          setSelectedReservation((prev) => (prev ? { ...prev, status } : null))
        }}
        onEdit={(r) => openEditModal(r)}
        onDelete={async (id) => {
          await onDelete(id)
          setSelectedReservation(null)
        }}
      />
    </DashboardLayout>
  )
}
