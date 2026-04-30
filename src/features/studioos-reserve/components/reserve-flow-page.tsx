import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import { displayNameFromOAuthUser, signOut, useAuth } from '@/features/auth'
import { getEquipmentAvailabilityForReserveSlug } from '../api/get-equipment-availability-for-reserve-slug'
import { createLead } from '../api/create-lead'
import { resolveTenantBySlug } from '../api/resolve-tenant-by-slug'
import { usePrefillPhone } from '../hooks/use-prefill-phone'
import { reserveContactSchema, reserveWindowSchema } from '../schemas/reserve.schemas'
import type { PublicReservationRequestPayload, ReserveRentalKind } from '../types'

const TYPE_LABEL: Record<string, string> = {
  camara: 'Cámara',
  lente: 'Lente',
  iluminacion: 'Iluminación',
  audio: 'Audio',
  tramoya: 'Tramoya',
  estudio: 'Estudio',
  video: 'Video',
  otros_accesorios: 'Accesorios',
}


function formatWindow(start: string, end: string): string {
  const s = new Date(start)
  const e = new Date(end)
  const sameDay = s.toDateString() === e.toDateString()
  const dateFmt = new Intl.DateTimeFormat('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })
  const timeFmt = new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })
  if (sameDay) {
    return `${dateFmt.format(s)} · ${timeFmt.format(s)} – ${timeFmt.format(e)}`
  }
  return `${dateFmt.format(s)} ${timeFmt.format(s)} – ${dateFmt.format(e)} ${timeFmt.format(e)}`
}

function localDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function buildWindowStrings(
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string
): { start: string; end: string } {
  const norm = (t: string) => (t.length === 5 ? `${t}:00` : t)
  return {
    start: `${startDate}T${norm(startTime)}`,
    end: `${endDate}T${norm(endTime)}`,
  }
}


interface ReserveFlowPageProps {
  tenantSlug: string
  /** Puede ser string o, en edge cases del router, otro tipo — se normaliza. */
  initialPhone?: unknown
}

export function ReserveFlowPage({
  tenantSlug,
  initialPhone,
}: ReserveFlowPageProps) {
  const { user } = useAuth()
  const today = localDateString(new Date())
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [rentalKind, setRentalKind] = useState<ReserveRentalKind | null>(null)
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)
  const [startTime, setStartTime] = useState('00:00')
  const [endTime, setEndTime] = useState('23:59')
  const [selectedQty, setSelectedQty] = useState<Record<string, number>>({})
  const [activeType, setActiveType] = useState<string | null>(null)
  const [contactName, setContactName] = useState(
    () => displayNameFromOAuthUser(user) || ''
  )
  const [contactEmail, setContactEmail] = useState(user?.email ?? '')
  const prefillPhone = usePrefillPhone(initialPhone)
  const [contactPhone, setContactPhone] = useState(prefillPhone)
  
  // Qualification fields (Modulo 1)
  const [companyName, setCompanyName] = useState('')
  const [paxCount, setPaxCount] = useState(1)
  const [requiresInvoice, setRequiresInvoice] = useState(false)
  const [budget, setBudget] = useState<number | string>('')
  
  const [notes, setNotes] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [contactErrors, setContactErrors] = useState<Partial<Record<'contactName' | 'contactEmail' | 'contactPhone' | 'notes' | 'paxCount' | 'budget', string>>>({})

  // Date validation effect removed to avoid cascading renders.

  /** Si el perfil de Google llega después del primer paint, rellena nombre vacío. */
  useEffect(() => {
    const fromGoogle = displayNameFromOAuthUser(user)
    if (!fromGoogle) return
    setContactName((prev) => (prev.trim() ? prev : fromGoogle))
  }, [user])

  const { data: tenant, isLoading: tenantLoading } = useQuery({
    queryKey: ['tenant-by-slug', tenantSlug],
    queryFn: () => resolveTenantBySlug(tenantSlug),
  })

  const windowStr = useMemo(
    () => buildWindowStrings(startDate, startTime, endDate, endTime),
    [startDate, startTime, endDate, endTime]
  )

  // Source detection logic based on URL params
  const source = useMemo((): 'whatsapp' | 'instagram' | 'web' => {
    const params = new URLSearchParams(window.location.search)
    if (params.has('phone')) return 'whatsapp'
    if (params.has('profile') || params.has('ig_id')) return 'instagram'
    return 'web'
  }, [])

  const timeValidation = useMemo(() => {
    const result = reserveWindowSchema.safeParse({ startDate, endDate, startTime, endTime })
    if (result.success) return { ok: true as const, message: null }
    const message = result.error.issues[0]?.message ?? 'Fecha u hora no válida.'
    return { ok: false as const, message }
  }, [startDate, endDate, startTime, endTime])

  const [nowMs, setNowMs] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 5_000)
    return () => window.clearInterval(id)
  }, [])

  const startInPast = useMemo(() => {
    if (!timeValidation.ok) return false
    const startMs = new Date(windowStr.start).getTime()
    if (Number.isNaN(startMs)) return false
    return startMs < nowMs - 60_000
  }, [timeValidation.ok, windowStr.start, nowMs])

  const canQueryAvailability =
    timeValidation.ok &&
    !startInPast &&
    rentalKind !== null &&
    Boolean(tenant?.id) &&
    step >= 3

  const { data: availabilityRows = [], isFetching: availabilityLoading } =
    useQuery({
      queryKey: [
        'reserve-equipment-availability',
        tenantSlug,
        windowStr.start,
        windowStr.end,
      ],
      queryFn: () =>
        getEquipmentAvailabilityForReserveSlug(
          tenantSlug,
          windowStr.start,
          windowStr.end
        ),
      enabled: canQueryAvailability,
      staleTime: 30_000,
    })

  const pickableEquipment = useMemo(() => {
    if (!rentalKind) return []
    return availabilityRows.filter((row) => {
      if ((row.available ?? 0) <= 0) return false
      if (rentalKind === 'estudio') return row.type === 'estudio'
      return row.type !== 'estudio'
    })
  }, [availabilityRows, rentalKind])

  const categoryTabs = useMemo(() => {
    const seen = new Set<string>()
    const order = Object.keys(TYPE_LABEL)
    return pickableEquipment
      .map((r) => r.type)
      .filter((t) => { if (seen.has(t)) return false; seen.add(t); return true })
      .sort((a, b) => (order.indexOf(a) ?? 99) - (order.indexOf(b) ?? 99))
  }, [pickableEquipment])

  useEffect(() => {
    setActiveType('__all__')
  }, [categoryTabs])

  const visibleItems = useMemo(
    () =>
      activeType === '__all__'
        ? pickableEquipment
        : pickableEquipment.filter((r) => r.type === activeType),
    [pickableEquipment, activeType]
  )

  const setItemQty = (id: string, qty: number, max: number) => {
    const clamped = Math.max(0, Math.min(qty, max))
    setSelectedQty((prev) => {
      const next = { ...prev }
      if (clamped === 0) delete next[id]
      else next[id] = clamped
      return next
    })
  }

  const totalSelected = Object.values(selectedQty).reduce((s, n) => s + n, 0)

  const goNextFromStep1 = () => {
    if (!rentalKind) {
      toast.error('Selecciona lo que deseas rentar.')
      return
    }
    setStep(2)
  }

  const goNextFromStep2 = () => {
    if (!timeValidation.ok) {
      toast.error(timeValidation.message)
      return
    }
    if (startInPast) {
      toast.error(
        'No puedes elegir una fecha u hora de inicio en el pasado.'
      )
      return
    }
    setSelectedQty({})
    setStep(3)
  }

  const goNextFromStep3 = () => {
    if (totalSelected === 0) {
      toast.error('Selecciona al menos un ítem disponible.')
      return
    }
    setStep(4)
  }

  const handleSalir = async () => {
    setIsSigningOut(true)
    try {
      await signOut()
    } catch (err) {
      toast.error('No se pudo cerrar sesión', {
        description: err instanceof Error ? err.message : 'Intenta de nuevo.',
      })
    } finally {
      setIsSigningOut(false)
    }
  }

  const handleSubmit = (e: { preventDefault(): void }) => {
    e.preventDefault()
    if (!tenant || !rentalKind) return

    const parsed = reserveContactSchema.safeParse({
      contactName: contactName.trim(),
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone.trim(),
      companyName: companyName.trim(),
      paxCount,
      requiresInvoice,
      budget: budget === '' ? 0 : Number(budget),
      notes: notes.trim(),
    })

    if (!parsed.success) {
      const fieldErrors: typeof contactErrors = {}
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof typeof contactErrors
        if (field && !fieldErrors[field]) fieldErrors[field] = issue.message
      }
      setContactErrors(fieldErrors)
      toast.error('Revisa los campos marcados.')
      return
    }

    setContactErrors({})

    const { 
      contactName: validName, 
      contactEmail: validEmail, 
      contactPhone: validPhone, 
      companyName: validCompany,
      paxCount: validPax,
      requiresInvoice: validInvoice,
      budget: validBudget,
      notes: validNotes 
    } = parsed.data

    const payload: PublicReservationRequestPayload = {
      tenantSlug,
      tenantId: tenant.id,
      tenantName: tenant.name,
      rentalKind,
      equipmentIds: Object.entries(selectedQty).flatMap(([id, n]) =>
        Array<string>(n).fill(id)
      ),
      windowStart: windowStr.start,
      windowEnd: windowStr.end,
      contactName: validName,
      contactEmail: validEmail,
      contactPhone: validPhone ?? '',
      companyName: validCompany ?? '',
      paxCount: validPax,
      requiresInvoice: validInvoice,
      budget: validBudget ?? 0,
      notes: validNotes ?? '',
      source,
      submittedByUserId: user?.id,
    }

    createLead(payload)
      .then(() => {
        setSubmitted(true)
        toast.success('¡Solicitud enviada! Te contactaremos pronto.')
      })
      .catch((err) => {
        toast.error('Error al enviar la solicitud: ' + err.message)
      })
  }

  const labelCls =
    'mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400'
  const inputCls =
    'block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-slate-600 focus:ring-1 focus:ring-slate-600 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white'

  if (tenantLoading) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950'>
        <span className='material-symbols-outlined animate-spin text-4xl text-slate-400'>
          progress_activity
        </span>
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className='flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center dark:bg-slate-950'>
        <p className='max-w-md text-sm text-slate-600 dark:text-slate-400'>
          No hay un estudio registrado con el identificador{' '}
          <span className='font-mono font-semibold'>{tenantSlug}</span>. Revisa
          el enlace (debe coincidir con el slug del negocio en StudioOS).
        </p>
        <Link
          to='/'
          className='text-sm font-semibold text-slate-900 underline dark:text-white'
        >
          Volver al inicio
        </Link>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-slate-50 pb-16 dark:bg-slate-950'>
      <header className='sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95'>
        <div className='mx-auto flex max-w-3xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <p className='text-xs font-bold tracking-widest text-slate-500 uppercase'>
              StudioOS
            </p>
            <h1 className='text-xl font-bold tracking-tight text-slate-900 dark:text-white'>
              {tenant.name}
            </h1>
            <p className='text-xs text-slate-500 dark:text-slate-400'>
              Reserva pública · paso {step} de 4
            </p>
          </div>
          <button
            type='button'
            onClick={handleSalir}
            disabled={isSigningOut}
            className='text-xs font-semibold text-slate-600 underline-offset-2 hover:underline disabled:opacity-50 dark:text-slate-400'
          >
            {isSigningOut ? 'Cerrando…' : 'Salir'}
          </button>
        </div>
      </header>

      <div className='mx-auto mt-6 max-w-3xl px-4'>
        <div className='mb-8'>
          <div className='flex gap-2'>
            {([1, 2, 3, 4] as const).map((s) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition ${
                  step >= s ? 'bg-slate-900 dark:bg-white' : 'bg-slate-200 dark:bg-slate-800'
                }`}
              />
            ))}
          </div>
          <div className='mt-1.5 flex gap-2'>
            {(['Tipo', 'Fechas', 'Selección', 'Datos'] as const).map((label, i) => (
              <p
                key={label}
                className={`flex-1 text-center text-[10px] font-semibold transition ${
                  step >= i + 1 ? 'text-slate-700 dark:text-slate-300' : 'text-slate-300 dark:text-slate-700'
                }`}
              >
                {label}
              </p>
            ))}
          </div>
        </div>

        {/* Paso 1: tipo (estudio vs equipo) */}
        {step === 1 && (
          <section className='rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
            <h2 className='text-lg font-bold text-slate-900 dark:text-white'>
              1 · ¿Qué necesitas rentar?
            </h2>
            <p className='mt-1 text-sm text-slate-500 dark:text-slate-400'>
              Elige una opción.
            </p>
            <div className='mt-6 grid gap-4 sm:grid-cols-2'>
              <button
                type='button'
                aria-pressed={rentalKind === 'estudio'}
                onClick={() => { if (rentalKind !== 'estudio') setSelectedQty({}); setRentalKind('estudio') }}
                className={`relative flex flex-col rounded-2xl border p-6 text-left transition ${
                  rentalKind === 'estudio'
                    ? 'border-slate-900 ring-2 ring-slate-900 dark:border-white dark:ring-white'
                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
                }`}
              >
                <span
                  className={`material-symbols-outlined absolute top-4 right-4 text-[20px] transition ${
                    rentalKind === 'estudio'
                      ? 'text-slate-900 dark:text-white'
                      : 'text-slate-200 dark:text-slate-700'
                  }`}
                >
                  {rentalKind === 'estudio' ? 'check_circle' : 'circle'}
                </span>
                <span className='material-symbols-outlined mb-3 text-3xl text-slate-700 dark:text-slate-200'>
                  meeting_room
                </span>
                <span className='font-bold text-slate-900 dark:text-white'>
                  Estudio / foro
                </span>
                <span className='mt-1 text-sm text-slate-500 dark:text-slate-400'>
                  Espacio de grabación o set acústico.
                </span>
              </button>
              <button
                type='button'
                aria-pressed={rentalKind === 'equipo'}
                onClick={() => { if (rentalKind !== 'equipo') setSelectedQty({}); setRentalKind('equipo') }}
                className={`relative flex flex-col rounded-2xl border p-6 text-left transition ${
                  rentalKind === 'equipo'
                    ? 'border-slate-900 ring-2 ring-slate-900 dark:border-white dark:ring-white'
                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
                }`}
              >
                <span
                  className={`material-symbols-outlined absolute top-4 right-4 text-[20px] transition ${
                    rentalKind === 'equipo'
                      ? 'text-slate-900 dark:text-white'
                      : 'text-slate-200 dark:text-slate-700'
                  }`}
                >
                  {rentalKind === 'equipo' ? 'check_circle' : 'circle'}
                </span>
                <span className='material-symbols-outlined mb-3 text-3xl text-slate-700 dark:text-slate-200'>
                  videocam
                </span>
                <span className='font-bold text-slate-900 dark:text-white'>
                  Equipo
                </span>
                <span className='mt-1 text-sm text-slate-500 dark:text-slate-400'>
                  Cámaras, audio, iluminación, grip y accesorios.
                </span>
              </button>
            </div>
            <div className='mt-8 flex justify-end'>
              <button
                type='button'
                onClick={goNextFromStep1}
                className='rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200'
              >
                Continuar
              </button>
            </div>
          </section>
        )}

        {/* Paso 2: fechas y horas (sin consultar disponibilidad) */}
        {step === 2 && (
          <section className='rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
            <h2 className='text-lg font-bold text-slate-900 dark:text-white'>
              2 · Fecha y horario
            </h2>
            <p className='mt-1 text-sm text-slate-500 dark:text-slate-400'>
              Define las fechas (puede abarcar varios días). La
              disponibilidad se calculará en el paso siguiente.
            </p>
            <div className='mt-6 grid gap-4 sm:grid-cols-2'>
              <div>
                <label className={labelCls} htmlFor='res-start-date'>
                  Fecha de inicio
                </label>
                <input
                  id='res-start-date'
                  type='date'
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls} htmlFor='res-end-date'>
                  Fecha de fin
                </label>
                <input
                  id='res-end-date'
                  type='date'
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls} htmlFor='res-start-time'>
                  Hora de inicio
                </label>
                <input
                  id='res-start-time'
                  type='time'
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls} htmlFor='res-end-time'>
                  Hora de fin
                </label>
                <input
                  id='res-end-time'
                  type='time'
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            {(!timeValidation.ok || startInPast) && (
              <div
                role='alert'
                className='mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-800 dark:bg-amber-950/30'
              >
                <span className='material-symbols-outlined mt-px shrink-0 text-[18px] text-amber-600 dark:text-amber-400'>
                  warning
                </span>
                <p className='text-sm font-medium text-amber-700 dark:text-amber-400'>
                  {!timeValidation.ok
                    ? timeValidation.message
                    : 'No puedes elegir una fecha u hora de inicio en el pasado.'}
                </p>
              </div>
            )}

            <div className='mt-8 flex flex-wrap justify-between gap-3'>
              <button
                type='button'
                onClick={() => setStep(1)}
                className='rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-600 dark:text-slate-300'
              >
                Atrás
              </button>
              <button
                type='button'
                onClick={goNextFromStep2}
                disabled={!timeValidation.ok || startInPast}
                className='rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200'
              >
                Continuar
              </button>
            </div>
          </section>
        )}

        {/* Paso 3: ítems disponibles según tipo + ventana */}
        {step === 3 && (
          <section className='rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
            <h2 className='text-lg font-bold text-slate-900 dark:text-white'>
              3 · Elige disponibles
            </h2>
            <p className='mt-1 text-sm text-slate-500 dark:text-slate-400'>
              {rentalKind === 'estudio' ? 'Estudios / foros' : 'Equipo'} con
              stock en{' '}
              <span className='font-semibold text-slate-700 dark:text-slate-300'>
                {formatWindow(windowStr.start, windowStr.end)}
              </span>
              .
            </p>

            {availabilityLoading ? (
              <ul className='mt-6 grid gap-3 sm:grid-cols-2'>
                {Array.from({ length: 4 }).map((_, i) => (
                  <li key={i} className='animate-pulse rounded-xl border border-slate-200 p-4 dark:border-slate-700'>
                    <div className='mb-2 h-3 w-12 rounded-full bg-slate-200 dark:bg-slate-700' />
                    <div className='mb-1.5 h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-700' />
                    <div className='h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-700' />
                  </li>
                ))}
              </ul>
            ) : pickableEquipment.length === 0 ? (
              <div className='mt-10 flex flex-col items-center gap-3 py-8 text-center'>
                <span className='material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600'>
                  event_busy
                </span>
                <p className='font-semibold text-slate-700 dark:text-slate-300'>
                  Sin disponibilidad en este rango
                </p>
                <p className='max-w-xs text-sm text-slate-500 dark:text-slate-400'>
                  No hay ítems disponibles para la ventana seleccionada. Cambia
                  fechas u horarios.
                </p>
                <button
                  type='button'
                  onClick={() => setStep(2)}
                  className='mt-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                >
                  ← Cambiar fechas
                </button>
              </div>
            ) : (
              <div className='mt-6'>
                {/* Category tabs */}
                <div className='flex justify-center'>
                  <div className='flex flex-wrap justify-center gap-1'>
                    {/* "Todo" tab */}
                    {(() => {
                      const isActive = activeType === '__all__'
                      const allSelected = totalSelected
                      return (
                        <button
                          key='__all__'
                          type='button'
                          onClick={() => setActiveType('__all__')}
                          className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                            isActive
                              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800'
                          }`}
                        >
                          Todo
                          {allSelected > 0 && (
                            <span
                              className={`flex size-4 items-center justify-center rounded-full text-[10px] font-bold ${
                                isActive
                                  ? 'bg-white text-slate-900 dark:bg-slate-900 dark:text-white'
                                  : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                              }`}
                            >
                              {allSelected}
                            </span>
                          )}
                        </button>
                      )
                    })()}

                    {/* Per-category tabs */}
                    {categoryTabs.map((type) => {
                      const isActive = activeType === type
                      const label = TYPE_LABEL[type] ?? type
                      const selectedInTab = pickableEquipment
                        .filter((r) => r.type === type)
                        .reduce((s, r) => s + (selectedQty[r.id] ?? 0), 0)
                      return (
                        <button
                          key={type}
                          type='button'
                          onClick={() => setActiveType(type)}
                          className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                            isActive
                              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800'
                          }`}
                        >
                          {label}
                          {selectedInTab > 0 && (
                            <span
                              className={`flex size-4 items-center justify-center rounded-full text-[10px] font-bold ${
                                isActive
                                  ? 'bg-white text-slate-900 dark:bg-slate-900 dark:text-white'
                                  : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                              }`}
                            >
                              {selectedInTab}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Items grid for active tab */}
                <ul className='mt-4 grid gap-3 sm:grid-cols-2'>
                  {visibleItems.map((row) => {
                    const qty = selectedQty[row.id] ?? 0
                    const isSelected = qty > 0
                    return (
                      <li
                        key={row.id}
                        className={`flex flex-col overflow-hidden rounded-xl border transition ${
                          isSelected
                            ? 'border-slate-900 ring-2 ring-slate-900 dark:border-white dark:ring-white'
                            : 'border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {row.image_url ? (
                          <img
                            src={row.image_url}
                            alt={row.name}
                            className='h-32 w-full object-cover'
                          />
                        ) : (
                          <div className='flex h-20 w-full items-center justify-center bg-slate-100 dark:bg-slate-800'>
                            <span className='material-symbols-outlined text-3xl text-slate-300 dark:text-slate-600'>
                              photo_camera
                            </span>
                          </div>
                        )}

                        <div className='flex flex-1 flex-col p-4'>
                          <p className='font-semibold text-slate-900 dark:text-white'>
                            {row.name}
                          </p>
                          <p className='mt-1 text-xs text-emerald-700 dark:text-emerald-400'>
                            {row.available}{' '}
                            {row.available === 1 ? 'disponible' : 'disponibles'}{' '}
                          </p>

                          <div className='mt-3 flex items-center gap-2 self-end'>
                            <button
                              type='button'
                              disabled={qty === 0}
                              onClick={() => setItemQty(row.id, qty - 1, row.available)}
                              className='flex size-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 disabled:opacity-30 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700'
                              aria-label='Reducir cantidad'
                            >
                              <span className='material-symbols-outlined text-[18px]'>remove</span>
                            </button>
                            <span className='w-5 text-center text-sm font-bold tabular-nums text-slate-900 dark:text-white'>
                              {qty}
                            </span>
                            <button
                              type='button'
                              disabled={qty >= row.available}
                              onClick={() => setItemQty(row.id, qty + 1, row.available)}
                              className='flex size-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 disabled:opacity-30 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700'
                              aria-label='Aumentar cantidad'
                            >
                              <span className='material-symbols-outlined text-[18px]'>add</span>
                            </button>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            <div className='mt-8 flex flex-wrap justify-between gap-3'>
              <button
                type='button'
                onClick={() => setStep(2)}
                className='rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-600 dark:text-slate-300'
              >
                Atrás
              </button>
              <button
                type='button'
                onClick={goNextFromStep3}
                disabled={totalSelected === 0 || availabilityLoading}
                className='rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200'
              >
                Continuar
              </button>
            </div>
          </section>
        )}

        {/* Confirmación post-submit */}
        {submitted && (
          <section className='rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 text-center'>
            <span className='material-symbols-outlined text-5xl text-green-500'>
              check_circle
            </span>
            <h2 className='mt-4 text-xl font-bold text-slate-900 dark:text-white'>
              ¡Solicitud enviada!
            </h2>
            <p className='mt-2 text-sm text-slate-600 dark:text-slate-400'>
              Hemos recibido tu solicitud para <span className='font-semibold'>{tenant.name}</span>.<br />
              Te contactaremos pronto al correo <span className='font-semibold'>{contactEmail}</span>.
            </p>
          </section>
        )}

        {/* Paso 4: datos y solicitud */}
        {step === 4 && !submitted && (
          <section className='rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
            <h2 className='text-lg font-bold text-slate-900 dark:text-white'>
              4 · Tus datos y solicitud
            </h2>
            <div className='mt-1'>
              <p className='text-xs font-medium text-slate-500 dark:text-slate-400'>
                {formatWindow(windowStr.start, windowStr.end)}
              </p>
              <ul className='mt-1.5 space-y-0.5'>
                {availabilityRows
                  .filter((r) => (selectedQty[r.id] ?? 0) > 0)
                  .map((r) => (
                    <li key={r.id} className='flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300'>
                      <span className='material-symbols-outlined text-[14px] text-slate-400'>
                        check
                      </span>
                      <span>
                        {r.name}
                        {(selectedQty[r.id] ?? 0) > 1 && (
                          <span className='ml-1 font-bold'>×{selectedQty[r.id]}</span>
                        )}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
            <form className='mt-6 space-y-4' onSubmit={handleSubmit}>
              <div className='grid gap-4 sm:grid-cols-2'>
                <div>
                  <label className={labelCls} htmlFor='c-name'>
                    Nombre completo *
                  </label>
                  <input
                    id='c-name'
                    value={contactName}
                    onChange={(e) => {
                      setContactName(e.target.value)
                      setContactErrors((prev) => ({ ...prev, contactName: undefined }))
                    }}
                    aria-invalid={Boolean(contactErrors.contactName)}
                    aria-describedby={contactErrors.contactName ? 'c-name-err' : undefined}
                    className={`${inputCls} ${contactErrors.contactName ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : ''}`}
                  />
                  {contactErrors.contactName && (
                    <p id='c-name-err' role='alert' className='mt-1 text-xs text-red-600 dark:text-red-400'>
                      {contactErrors.contactName}
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelCls} htmlFor='c-email'>
                    Correo *
                  </label>
                  <input
                    id='c-email'
                    type='email'
                    value={contactEmail}
                    onChange={(e) => {
                      setContactEmail(e.target.value)
                      setContactErrors((prev) => ({ ...prev, contactEmail: undefined }))
                    }}
                    aria-invalid={Boolean(contactErrors.contactEmail)}
                    aria-describedby={contactErrors.contactEmail ? 'c-email-err' : undefined}
                    className={`${inputCls} ${contactErrors.contactEmail ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : ''}`}
                  />
                  {contactErrors.contactEmail && (
                    <p id='c-email-err' role='alert' className='mt-1 text-xs text-red-600 dark:text-red-400'>
                      {contactErrors.contactEmail}
                    </p>
                  )}
                </div>
              </div>

              <div className='grid gap-4 sm:grid-cols-2'>
                <div>
                  <label className={labelCls} htmlFor='c-phone'>
                    Teléfono *
                  </label>
                  <input
                    id='c-phone'
                    type='tel'
                    value={contactPhone}
                    onChange={(e) => {
                      setContactPhone(e.target.value)
                      setContactErrors((prev) => ({ ...prev, contactPhone: undefined }))
                    }}
                    aria-invalid={Boolean(contactErrors.contactPhone)}
                    aria-describedby={contactErrors.contactPhone ? 'c-phone-err' : undefined}
                    className={`${inputCls} ${contactErrors.contactPhone ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : ''}`}
                    placeholder='Ej. +52 55 1234 5678'
                  />
                  {contactErrors.contactPhone && (
                    <p id='c-phone-err' role='alert' className='mt-1 text-xs text-red-600 dark:text-red-400'>
                      {contactErrors.contactPhone}
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelCls} htmlFor='c-company'>
                    Empresa (opcional)
                  </label>
                  <input
                    id='c-company'
                    type='text'
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className={inputCls}
                    placeholder='Nombre de tu productora o agencia'
                  />
                </div>
              </div>

              <div className='grid gap-4 sm:grid-cols-2'>
                <div>
                  <label className={labelCls} htmlFor='c-pax'>
                    Número de personas *
                  </label>
                  <input
                    id='c-pax'
                    type='number'
                    min={1}
                    value={paxCount}
                    onChange={(e) => {
                      setPaxCount(Number(e.target.value))
                      setContactErrors((prev) => ({ ...prev, paxCount: undefined }))
                    }}
                    aria-invalid={Boolean(contactErrors.paxCount)}
                    aria-describedby={contactErrors.paxCount ? 'c-pax-err' : undefined}
                    className={`${inputCls} ${contactErrors.paxCount ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : ''}`}
                  />
                  {contactErrors.paxCount && (
                    <p id='c-pax-err' role='alert' className='mt-1 text-xs text-red-600 dark:text-red-400'>
                      {contactErrors.paxCount}
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelCls} htmlFor='c-budget'>
                    Presupuesto aprox. (opcional)
                  </label>
                  <div className='relative'>
                    <span className='absolute inset-y-0 left-3 flex items-center text-slate-400'>
                      $
                    </span>
                    <input
                      id='c-budget'
                      type='number'
                      value={budget}
                      onChange={(e) => {
                        setBudget(e.target.value)
                        setContactErrors((prev) => ({ ...prev, budget: undefined }))
                      }}
                      className={`${inputCls} pl-7`}
                      placeholder='0.00'
                    />
                  </div>
                </div>
              </div>

              <div className='flex items-center gap-3 py-1'>
                <input
                  id='c-invoice'
                  type='checkbox'
                  checked={requiresInvoice}
                  onChange={(e) => setRequiresInvoice(e.target.checked)}
                  className='size-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:ring-offset-slate-900'
                />
                <label
                  htmlFor='c-invoice'
                  className='text-sm font-medium text-slate-700 dark:text-slate-300'
                >
                  Requiere factura fiscal
                </label>
              </div>

              <div>
                <label className={labelCls} htmlFor='c-notes'>
                  Notas adicionales
                </label>
                <textarea
                  id='c-notes'
                  rows={3}
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value)
                    setContactErrors((prev) => ({ ...prev, notes: undefined }))
                  }}
                  aria-invalid={Boolean(contactErrors.notes)}
                  aria-describedby={contactErrors.notes ? 'c-notes-err' : undefined}
                  className={`${inputCls} resize-none ${contactErrors.notes ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder='Detalles de producción, equipo extra, etc.'
                />
                {contactErrors.notes && (
                  <p id='c-notes-err' role='alert' className='mt-1 text-xs text-red-600 dark:text-red-400'>
                    {contactErrors.notes}
                  </p>
                )}
              </div>
              <div className='flex flex-wrap justify-between gap-3 pt-2'>
                <button
                  type='button'
                  onClick={() => setStep(3)}
                  className='rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-600 dark:text-slate-300'
                >
                  Atrás
                </button>
                <button
                  type='submit'
                  className='rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200'
                >
                  Solicitar reservación
                </button>
              </div>
            </form>
          </section>
        )}
      </div>
    </div>
  )
}
