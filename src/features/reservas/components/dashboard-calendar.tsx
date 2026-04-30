import React, { useState } from 'react'
import { supabase } from '@/supabase/client'
import { useAuth } from '@/features/auth'
import {
  ReservationFormModal,
  ReservationDetailModal,
  useReservations,
  type Reservation,
  type ReservationFormValues,
} from '@/features/reservas'
import { formatLocalDate } from '@/utils/date-utils'

// ─── Types ────────────────────────────────────────────────────────────────────


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

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]
const DAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const DAY_LONG = [
  'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado',
]

const COLOR_CHIP: Record<Booking['color'], string> = {
  blue: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800/50 dark:bg-blue-900/40 dark:text-blue-200',
  purple: 'border-purple-200 bg-purple-50 text-purple-800 dark:border-purple-800/50 dark:bg-purple-900/40 dark:text-purple-200',
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-900/40 dark:text-emerald-200',
  amber: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/50 dark:bg-amber-900/40 dark:text-amber-200',
  rose: 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800/50 dark:bg-rose-900/40 dark:text-rose-200',
}

const COLOR_ACCENT: Record<Booking['color'], string> = {
  blue: 'bg-blue-500', purple: 'bg-purple-500', emerald: 'bg-emerald-500', amber: 'bg-amber-500', rose: 'bg-rose-500',
}

const STATUS_CHIP: Record<Booking['status'], string> = {
  Confirmada: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300',
  Pendiente: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300',
  Cancelada: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DayBookingCard({ b, onClick }: { b: Booking; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`group relative flex w-full overflow-hidden rounded-xl border bg-white text-left shadow-sm transition-all duration-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800/60`}
    >
      <div className={`w-1.5 shrink-0 self-stretch ${COLOR_ACCENT[b.color]}`} />
      <div className='flex flex-1 flex-col gap-3 p-5 sm:flex-row sm:items-center'>
        <div className='flex min-w-[110px] flex-col'>
          <span className='text-xl font-light text-slate-900 dark:text-white'>
            {formatLocalDate(b.year + '-' + (b.month + 1) + '-' + b.day + 'T' + b.startTime, 'hh:mm a')}
          </span>
          <span className='text-xs font-medium tracking-wider text-slate-400 uppercase'>
            {formatLocalDate(b.year + '-' + (b.month + 1) + '-' + b.day + 'T' + b.endTime, 'hh:mm a')}
          </span>
        </div>
        <div className='flex-1'>
          <div className='mb-1.5 flex flex-wrap items-center gap-2'>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wide uppercase ${STATUS_CHIP[b.status]}`}>{b.status}</span>
          </div>
          <h4 className='text-base font-semibold text-slate-800 dark:text-slate-100'>{b.title}</h4>
          <div className='mt-1.5 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400'>
            <span className='material-symbols-outlined text-[14px]'>person</span>
            <span>{b.client}</span>
          </div>
        </div>
      </div>
    </button>
  )
}

function DailyFocusPanel({ date, bookings, onClose, onNewReservation, onSelectBookingId }: {
  date: Date;
  bookings: Booking[];
  onClose: () => void;
  onNewReservation: (iso: string) => void;
  onSelectBookingId: (id: string) => void;
}) {
  const dayName = DAY_LONG[date.getDay()]
  const dayNum = date.getDate()
  const monthStr = MONTH_NAMES[date.getMonth()]
  const year = date.getFullYear()
  const isoDate = `${year}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`

  return (
    <div className='flex w-full flex-col gap-5 xl:w-[420px] xl:shrink-0'>
      <div className='flex items-start justify-between border-b border-slate-200 pb-4 dark:border-slate-700'>
        <div>
          <div className='text-primary mb-0.5 flex items-center gap-2 text-xs font-semibold tracking-widest uppercase'>
            <span className='material-symbols-outlined text-[16px]'>calendar_today</span> Vista del Día
          </div>
          <h2 className='text-3xl font-light text-slate-900 dark:text-white'>{dayName},&nbsp;<span className='font-semibold'>{dayNum}</span></h2>
          <p className='text-sm text-slate-400'>{monthStr} {year}</p>
        </div>
        <button onClick={onClose} className='mt-1 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700'>
          <span className='material-symbols-outlined text-[20px]'>close</span>
        </button>
      </div>
      {bookings.length === 0 ? (
        <div className='flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-200 py-10 text-slate-400 dark:border-slate-700'>
          <span className='material-symbols-outlined text-[36px]'>event_busy</span>
          <p className='text-sm font-medium'>Sin reservas para este día</p>
        </div>
      ) : (
        <div className='flex flex-col gap-3'>
          {bookings.map((b) => <DayBookingCard key={b.id} b={b} onClick={() => onSelectBookingId(b.id)} />)}
        </div>
      )}
      <button onClick={() => onNewReservation(isoDate)} className='hover:border-primary/40 hover:text-primary flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-3.5 text-sm font-semibold text-slate-400 transition-all dark:border-slate-700'>
        <span className='material-symbols-outlined text-[18px]'>add_circle</span> Nueva Reserva para este día
      </button>
    </div>
  )
}

function MonthView({ year, month, bookings, selectedDay, onSelectDay }: {
  year: number;
  month: number;
  bookings: Booking[];
  selectedDay: number | null;
  onSelectDay: (day: number) => void;
}) {
  const firstDow = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevDays = new Date(year, month, 0).getDate()
  const today = new Date()
  const isThisMonth = today.getFullYear() === year && today.getMonth() === month

  const cells: { day: number; cur: boolean }[] = []
  for (let i = firstDow - 1; i >= 0; i--) cells.push({ day: prevDays - i, cur: false })
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, cur: true })
  while (cells.length % 7 !== 0) cells.push({ day: cells.length - daysInMonth - firstDow + 1, cur: false })

  return (
    <div>
      <div className='mb-2 grid grid-cols-7 gap-px'>
        {DAY_SHORT.map((d) => <div key={d} className='py-2 text-center text-[11px] font-bold tracking-widest text-slate-400 uppercase'>{d}</div>)}
      </div>
      <div className={`grid grid-cols-7 gap-2`}>
        {cells.map(({ day, cur }, idx) => {
          if (!cur) return <div key={`filler-${idx}`} className='min-h-[90px] rounded-lg p-2'><span className='text-sm font-medium text-slate-300 dark:text-slate-700'>{day}</span></div>
          const isToday = isThisMonth && day === today.getDate()
          const isSelected = day === selectedDay
          const bookingsForDay = bookings.filter((b) => b.day === day)
          return (
            <div key={`day-${day}`} onClick={() => onSelectDay(day)} className={['group relative min-h-[90px] cursor-pointer rounded-lg border p-2 shadow-sm transition-all duration-200', isSelected ? 'border-slate-900 bg-slate-50 dark:bg-slate-900/40 shadow-md' : 'border-slate-200 bg-white hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800'].join(' ')}>
              {isToday ? <span className='bg-slate-900 flex size-6 items-center justify-center rounded-full text-sm font-bold text-white shadow'>{day}</span> : <span className={`text-sm font-medium ${isSelected ? 'text-slate-900 font-bold dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>{day}</span>}
              <div className='mt-1.5 flex flex-col gap-1'>
                {bookingsForDay.slice(0, 2).map((b) => <div key={b.id} className={`truncate rounded border px-1.5 py-0.5 text-[11px] font-semibold ${COLOR_CHIP[b.color]}`}>{b.title}</div>)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DashboardCalendar() {
  const { session } = useAuth()

  // Onboarding state
  const [studioName, setStudioName] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [isCreatingTenant, setIsCreatingTenant] = useState(false)
  const [onboardError, setOnboardError] = useState<string | null>(null)

  // Calendar state
  const today = new Date()
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate())

  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false)
  const [reservationInitialDate, setReservationInitialDate] = useState<string | undefined>()
  const [isSavingReservation, setIsSavingReservation] = useState(false)
  const [reservationError, setReservationError] = useState<string | null>(null)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null)

  const { onCreate: createReservation, onUpdate: updateReservation, onUpdateStatus, onDelete, reservations } = useReservations()

  const openReservationModal = (isoDate?: string) => {
    setEditingReservation(null)
    setReservationInitialDate(isoDate)
    setReservationError(null)
    setIsReservationModalOpen(true)
  }

  const openEditModal = (r: Reservation) => {
    setEditingReservation(r)
    setReservationInitialDate(r.date)
    setReservationError(null)
    setIsReservationModalOpen(true)
  }

  const handleSaveReservation = async (values: ReservationFormValues) => {
    setIsSavingReservation(true)
    setReservationError(null)
    try {
      if (editingReservation) await updateReservation(editingReservation.id, values)
      else await createReservation(values)
      setIsReservationModalOpen(false)
      setEditingReservation(null)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar'
      setReservationError(msg)
    } finally {
      setIsSavingReservation(false)
    }
  }

  const handleCreateStudio = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreatingTenant(true)
    try {
      const { error } = await supabase.rpc('create_new_tenant_with_admin', {
        p_tenant_name: studioName, p_first_name: firstName, p_last_name: lastName,
      })
      if (error) throw error
      window.location.reload()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al configurar'
      setOnboardError(msg)
      setIsCreatingTenant(false)
    }
  }

  const jwtClaims = (session?.user?.app_metadata || {}) as { tenant_id?: string }
  if (!jwtClaims.tenant_id) {
    return (
      <div className='flex min-h-[80vh] flex-col items-center justify-center p-4'>
        <div className='w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900'>
          <h2 className='mb-2 text-2xl font-bold'>Crea tu Estudio</h2>
          <p className='mb-6 text-sm text-slate-500'>Configura los detalles de tu compañía.</p>
          <form className='space-y-4' onSubmit={handleCreateStudio}>
            <input required value={studioName} onChange={(e) => setStudioName(e.target.value)} className='w-full rounded-lg border p-3' placeholder='Nombre del Estudio' />
            <div className='grid grid-cols-2 gap-4'>
              <input required value={firstName} onChange={(e) => setFirstName(e.target.value)} className='rounded-lg border p-3' placeholder='Nombre' />
              <input required value={lastName} onChange={(e) => setLastName(e.target.value)} className='rounded-lg border p-3' placeholder='Apellido' />
            </div>
            {onboardError && <p className='text-xs text-red-500'>{onboardError}</p>}
            <button type='submit' disabled={isCreatingTenant} className='w-full rounded-lg bg-slate-900 p-3 font-bold text-white'>{isCreatingTenant ? 'Configurando...' : 'Comenzar'}</button>
          </form>
        </div>
      </div>
    )
  }

  const COLORS: Booking['color'][] = ['blue', 'purple', 'emerald', 'amber', 'rose']
  const liveBookings: Booking[] = reservations.map((r, i) => {
    const [y, m, d] = r.date.split('-').map(Number)
    return {
      id: r.id, title: r.clientName || 'Reserva', client: r.clientName || '',
      startTime: r.startTime || '00:00', endTime: r.endTime || '00:00',
      color: COLORS[i % COLORS.length],
      status: r.status === 'confirmed' ? 'Confirmada' : r.status === 'canceled' ? 'Cancelada' : 'Pendiente',
      day: d, month: m - 1, year: y,
    }
  })

  const visibleBookings = liveBookings.filter(b => b.month === calMonth && b.year === calYear)
  const selectedDayBookings = selectedDay != null ? visibleBookings.filter(b => b.day === selectedDay) : []
  const selectedDate = selectedDay != null ? new Date(calYear, calMonth, selectedDay) : null

  return (
    <div className='space-y-6'>
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <div>
          <h3 className='text-2xl font-bold'>Reservas</h3>
          <p className='text-sm text-slate-500'>Gestiona disponibilidad y equipo.</p>
        </div>
        <button onClick={() => openReservationModal()} className='flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 font-semibold text-white dark:bg-white dark:text-slate-900'>
          <span className='material-symbols-outlined text-[18px]'>add</span> Nueva Reserva
        </button>
      </div>

      <div className='flex flex-col gap-6 xl:flex-row'>
        <div className='flex-1 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/50'>
          <div className='mb-4 flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <h4 className='text-lg font-bold capitalize'>{MONTH_NAMES[calMonth]} {calYear}</h4>
              <div className='flex gap-1'>
                <button onClick={() => setCalMonth(m => (m === 0 ? 11 : m - 1))} className='p-1'><span className='material-symbols-outlined'>chevron_left</span></button>
                <button onClick={() => setCalMonth(m => (m === 11 ? 0 : m + 1))} className='p-1'><span className='material-symbols-outlined'>chevron_right</span></button>
              </div>
            </div>
            <button onClick={() => { setCalMonth(today.getMonth()); setCalYear(today.getFullYear()); setSelectedDay(today.getDate()); }} className='text-xs font-bold uppercase text-slate-400'>Hoy</button>
          </div>
          <MonthView year={calYear} month={calMonth} bookings={visibleBookings} selectedDay={selectedDay} onSelectDay={setSelectedDay} />
        </div>

        {selectedDate && (
          <DailyFocusPanel
            date={selectedDate}
            bookings={selectedDayBookings}
            onClose={() => setSelectedDay(null)}
            onNewReservation={openReservationModal}
            onSelectBookingId={(id: string) => {
              const r = reservations.find(res => res.id === id)
              if (r) setSelectedReservation(r)
            }}
          />
        )}
      </div>

      <ReservationFormModal
        key={editingReservation?.id ?? 'new'}
        isOpen={isReservationModalOpen}
        isSaving={isSavingReservation}
        initialDate={reservationInitialDate}
        reservation={editingReservation}
        error={reservationError}
        onClose={() => setIsReservationModalOpen(false)}
        onSave={handleSaveReservation}
      />

      <ReservationDetailModal
        reservation={selectedReservation}
        onClose={() => setSelectedReservation(null)}
        onUpdateStatus={onUpdateStatus}
        onEdit={(r) => { setSelectedReservation(null); openEditModal(r); }}
        onDelete={async (id) => { await onDelete(id); setSelectedReservation(null); }}
      />
    </div>
  )
}
