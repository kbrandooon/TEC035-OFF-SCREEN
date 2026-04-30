import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { EquipmentAvailabilityResult } from '@/features/equipo-disponibilidad'
import { getEquipmentAvailabilityForReserveSlug } from '../api/get-equipment-availability-for-reserve-slug'
import { createLead } from '../api/create-lead'
import { resolveTenantBySlug } from '../api/resolve-tenant-by-slug'
import { toDatabaseTimestamp } from '@/utils/date-utils'
import { reserveContactSchema, reserveWindowSchema } from '../schemas/reserve.schemas'
import type { ReserveRentalKind } from '../types'

interface GuestReserveFlowProps {
  tenantSlug: string
  studioName: string
  initialPhone?: string
  onCancel: () => void
}

function localDateString(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatWindow(start: string, end: string): string {
  const s = new Date(start)
  const e = new Date(end)
  const sameDay = s.toDateString() === e.toDateString()
  const dateFmt = new Intl.DateTimeFormat('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })
  const timeFmt = new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })
  if (sameDay) return `${dateFmt.format(s)} · ${timeFmt.format(s)} – ${timeFmt.format(e)}`
  return `${dateFmt.format(s)} ${timeFmt.format(s)} – ${dateFmt.format(e)} ${timeFmt.format(e)}`
}

export function GuestReserveFlow({
  tenantSlug,
  studioName,
  initialPhone = '',
  onCancel,
}: GuestReserveFlowProps) {
  const today = localDateString(new Date())
  // Internal step: 1=Tipo, 2=Fechas, 3=Selección(equipo only), 4=Datos
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [submitted, setSubmitted] = useState(false)

  // Step 1
  const [rentalKind, setRentalKind] = useState<ReserveRentalKind | null>(null)

  // Step 2
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)
  const [startTime, setStartTime] = useState('00:00')
  const [endTime, setEndTime] = useState('23:59')

  // Step 3 — equipment selection
  const [selectedQty, setSelectedQty] = useState<Record<string, number>>({})
  const [activeType, setActiveType] = useState<string | null>(null)

  // Step 4
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState(initialPhone)
  
  // Qualification fields (Modulo 1)
  const [companyName, setCompanyName] = useState('')
  const [paxCount, setPaxCount] = useState(1)
  const [requiresInvoice, setRequiresInvoice] = useState(false)
  const [budget, setBudget] = useState<number | string>('')
  
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [contactErrors, setContactErrors] = useState<Partial<Record<'contactName' | 'contactEmail' | 'contactPhone' | 'notes' | 'paxCount' | 'budget', string>>>({})

  // Removed effect that caused cascading renders. Validation now happens in handlers.

  const windowStr = useMemo(() => {
    return {
      start: toDatabaseTimestamp(startDate, startTime),
      end: toDatabaseTimestamp(endDate, endTime),
    }
  }, [startDate, startTime, endDate, endTime])

  // Source detection logic based on URL params
  const source = useMemo((): 'whatsapp' | 'instagram' | 'web' => {
    const params = new URLSearchParams(window.location.search)
    if (params.has('phone')) return 'whatsapp'
    if (params.has('profile') || params.has('ig_id')) return 'instagram'
    return 'web'
  }, [])

  const timeValidation = useMemo(() => {
    const result = reserveWindowSchema.safeParse({ startDate, endDate, startTime, endTime })
    if (result.success) return { ok: true, message: null }
    const message = result.error.issues[0]?.message ?? 'Fecha u hora no válida.'
    return { ok: false, message }
  }, [startDate, endDate, startTime, endTime])

  // Tenant resolution
  const { data: tenant } = useQuery({
    queryKey: ['tenant-by-slug', tenantSlug],
    queryFn: () => resolveTenantBySlug(tenantSlug),
  })

  // Equipment availability — only when on equipo step 3
  const { data: availabilityRows = [], isLoading: availabilityLoading } = useQuery({
    queryKey: ['guest-equip-avail', tenantSlug, windowStr.start, windowStr.end],
    queryFn: () =>
      getEquipmentAvailabilityForReserveSlug(tenantSlug, windowStr.start, windowStr.end),
    enabled: step === 3 && rentalKind !== null && timeValidation.ok,
    staleTime: 60_000,
  })

  const pickableEquipment = useMemo(() => {
    return availabilityRows.filter((r) => {
      if (r.available <= 0) return false
      if (rentalKind === 'estudio') return r.type === 'estudio'
      return r.type !== 'estudio'
    })
  }, [availabilityRows, rentalKind])

  const categoryTabs = useMemo(() => {
    const types = [...new Set(pickableEquipment.map((r) => r.type))].sort()
    return types
  }, [pickableEquipment])

  const visibleItems = useMemo(() => {
    if (!activeType) return pickableEquipment
    return pickableEquipment.filter((r) => r.type === activeType)
  }, [pickableEquipment, activeType])

  const setItemQty = (id: string, qty: number, max: number) => {
    const clamped = Math.max(0, Math.min(qty, max))
    setSelectedQty((prev) => {
      if (clamped === 0) {
        const next = { ...prev }
        delete next[id]
        return next
      }
      return { ...prev, [id]: clamped }
    })
  }

  const totalSelected = Object.values(selectedQty).reduce((a, b) => a + b, 0)

  const goNextFromStep1 = () => {
    if (!rentalKind) {
      toast.error('Selecciona si necesitas estudio o equipo.')
      return
    }
    setStep(2)
  }

  const goNextFromStep2 = () => {
    if (!timeValidation.ok) {
      toast.error(timeValidation.message!)
      return
    }
    setSelectedQty({})
    setStep(3)
  }

  const goNextFromStep3 = () => {
    setStep(4)
  }

  const goBackFromStep4 = () => {
    setStep(3)
  }

  const handleSubmit = (e: { preventDefault(): void }) => {
    e.preventDefault()

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

    setIsSubmitting(true)
    createLead({
      tenantSlug,
      tenantId: tenant?.id || '',
      tenantName: studioName,
      rentalKind: rentalKind as ReserveRentalKind,
      equipmentIds: Object.entries(selectedQty).flatMap(([id, n]) => Array<string>(n).fill(id)),
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
    })
      .then(() => {
        setSubmitted(true)
      })
      .catch((err) => {
        toast.error('Error al enviar la solicitud: ' + err.message)
      })
      .finally(() => {
        setIsSubmitting(false)
      })
  }

  const labelCls =
    'mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400'
  const inputCls =
    'block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-slate-600 focus:ring-1 focus:ring-slate-600 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white'

  if (submitted) {
    return (
      <div className='flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 dark:bg-slate-950'>
        <div className='w-full max-w-md rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900'>
          <div className='mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'>
            <span className='material-symbols-outlined text-[28px]'>check</span>
          </div>
          <h2 className='text-xl font-bold text-slate-900 dark:text-white'>¡Solicitud enviada!</h2>
          <p className='mt-2 text-sm text-slate-500 dark:text-slate-400'>
            Nos pondremos en contacto contigo a la brevedad en{' '}
            <span className='font-semibold text-slate-700 dark:text-slate-300'>{contactEmail}</span>.
          </p>
          <button
            type='button'
            onClick={onCancel}
            className='mt-6 text-sm font-semibold text-slate-600 underline underline-offset-2 dark:text-slate-400'
          >
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-slate-50 pb-16 dark:bg-slate-950'>
      {/* Header */}
      <header className='sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95'>
        <div className='mx-auto flex max-w-3xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <p className='text-xs font-bold tracking-widest text-slate-500 uppercase'>StudioOS</p>
            <h1 className='text-xl font-bold tracking-tight text-slate-900 dark:text-white'>{studioName}</h1>
            <p className='text-xs text-slate-500 dark:text-slate-400'>
              Reserva como invitado · paso {step} de 4
            </p>
          </div>
          <button
            type='button'
            onClick={onCancel}
            className='text-xs font-semibold text-slate-600 underline-offset-2 hover:underline dark:text-slate-400'
          >
            Cancelar
          </button>
        </div>
      </header>

      <div className='mx-auto mt-6 max-w-3xl px-4'>
        {/* Progress bar */}
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

        {/* ── Step 1 — tipo ── */}
        {step === 1 && (
          <section className='rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
            <h2 className='text-lg font-bold text-slate-900 dark:text-white'>1 · ¿Qué necesitas rentar?</h2>
            <p className='mt-1 text-sm text-slate-500 dark:text-slate-400'>
              Elige una opción. En el siguiente paso indicarás fechas y horarios.
            </p>
            <div className='mt-6 grid gap-4 sm:grid-cols-2'>
              {([
                { value: 'estudio' as ReserveRentalKind, label: 'Estudio / foro', icon: 'meeting_room', desc: 'Espacio de grabación o set acústico.' },
                { value: 'equipo' as ReserveRentalKind, label: 'Equipo', icon: 'videocam', desc: 'Cámaras, audio, iluminación, grip y accesorios.' },
              ]).map((opt) => (
                <button
                  key={opt.value}
                  type='button'
                  aria-pressed={rentalKind === opt.value}
                  onClick={() => { if (rentalKind !== opt.value) setSelectedQty({}); setRentalKind(opt.value) }}
                  className={`relative flex flex-col rounded-2xl border p-6 text-left transition ${
                    rentalKind === opt.value
                      ? 'border-slate-900 ring-2 ring-slate-900 dark:border-white dark:ring-white'
                      : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
                  }`}
                >
                  <span className={`material-symbols-outlined absolute top-4 right-4 text-[20px] transition ${rentalKind === opt.value ? 'text-slate-900 dark:text-white' : 'text-slate-200 dark:text-slate-700'}`}>
                    {rentalKind === opt.value ? 'check_circle' : 'circle'}
                  </span>
                  <span className='material-symbols-outlined mb-3 text-3xl text-slate-700 dark:text-slate-200'>{opt.icon}</span>
                  <span className='font-bold text-slate-900 dark:text-white'>{opt.label}</span>
                  <span className='mt-1 text-sm text-slate-500 dark:text-slate-400'>{opt.desc}</span>
                </button>
              ))}
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

        {/* ── Step 2 — fechas ── */}
        {step === 2 && (
          <section className='rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
            <h2 className='text-lg font-bold text-slate-900 dark:text-white'>2 · Fecha y horario</h2>
            <p className='mt-1 text-sm text-slate-500 dark:text-slate-400'>
              Define la ventana completa. Puede abarcar varios días.
            </p>
            <div className='mt-6 grid gap-4 sm:grid-cols-2'>
              <div>
                <label className={labelCls} htmlFor='g-start-date'>Fecha de inicio</label>
                <input id='g-start-date' type='date' value={startDate} min={today} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls} htmlFor='g-end-date'>Fecha de fin</label>
                <input id='g-end-date' type='date' value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls} htmlFor='g-start-time'>Hora de inicio</label>
                <input id='g-start-time' type='time' value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls} htmlFor='g-end-time'>Hora de fin</label>
                <input id='g-end-time' type='time' value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputCls} />
              </div>
            </div>

            {!timeValidation.ok && (
              <div role='alert' className='mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-800 dark:bg-amber-950/30'>
                <span className='material-symbols-outlined mt-px shrink-0 text-[18px] text-amber-600 dark:text-amber-400'>warning</span>
                <p className='text-sm font-medium text-amber-700 dark:text-amber-400'>{timeValidation.message}</p>
              </div>
            )}

            <div className='mt-8 flex flex-wrap justify-between gap-3'>
              <button type='button' onClick={() => setStep(1)} className='rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-600 dark:text-slate-300'>
                Atrás
              </button>
              <button
                type='button'
                onClick={goNextFromStep2}
                disabled={!timeValidation.ok}
                className='rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200'
              >
                Continuar
              </button>
            </div>
          </section>
        )}

        {/* ── Step 3 — selección ── */}
        {step === 3 && (
          <section className='rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
            <h2 className='text-lg font-bold text-slate-900 dark:text-white'>
              3 · {rentalKind === 'estudio' ? 'Elige el estudio / foro' : 'Selecciona el equipo'}
            </h2>
            <p className='mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400'>
              {formatWindow(windowStr.start, windowStr.end)}
            </p>

            {/* Category tabs */}
            {!availabilityLoading && categoryTabs.length > 1 && (
              <div className='mt-4 flex justify-center'>
                <div className='flex flex-wrap justify-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800'>
                  <button
                    type='button'
                    onClick={() => setActiveType(null)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      activeType === null
                        ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    Todo
                    {totalSelected > 0 && (
                      <span className='ml-1.5 rounded-full bg-slate-900 px-1.5 py-0.5 text-[10px] text-white dark:bg-white dark:text-slate-900'>
                        {totalSelected}
                      </span>
                    )}
                  </button>
                  {categoryTabs.map((type) => {
                    const countInType = pickableEquipment
                      .filter((r) => r.type === type)
                      .reduce((a, r) => a + (selectedQty[r.id] ?? 0), 0)
                    return (
                      <button
                        key={type}
                        type='button'
                        onClick={() => setActiveType(type)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${
                          activeType === type
                            ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                        }`}
                      >
                        {type}
                        {countInType > 0 && (
                          <span className='ml-1.5 rounded-full bg-slate-900 px-1.5 py-0.5 text-[10px] text-white dark:bg-white dark:text-slate-900'>
                            {countInType}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <div className='mt-4'>
              {availabilityLoading ? (
                <div className='grid gap-3 sm:grid-cols-2'>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className='animate-pulse rounded-xl border border-slate-100 p-4 dark:border-slate-800'>
                      <div className='mb-3 h-32 rounded-lg bg-slate-100 dark:bg-slate-800' />
                      <div className='mb-2 h-3 w-12 rounded bg-slate-100 dark:bg-slate-800' />
                      <div className='mb-1 h-4 w-3/4 rounded bg-slate-100 dark:bg-slate-800' />
                      <div className='h-3 w-1/2 rounded bg-slate-100 dark:bg-slate-800' />
                    </div>
                  ))}
                </div>
              ) : visibleItems.length === 0 ? (
                <div className='flex flex-col items-center gap-3 py-12 text-center'>
                  <span className='material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600'>event_busy</span>
                  <p className='font-semibold text-slate-600 dark:text-slate-300'>Sin disponibilidad en este rango</p>
                  <p className='text-sm text-slate-500 dark:text-slate-400'>
                    No hay equipo disponible para las fechas seleccionadas.
                  </p>
                  <button
                    type='button'
                    onClick={() => setStep(2)}
                    className='mt-1 text-sm font-semibold text-slate-700 underline underline-offset-2 dark:text-slate-300'
                  >
                    ← Cambiar fechas
                  </button>
                </div>
              ) : (
                <div className='grid gap-3 sm:grid-cols-2'>
                  {visibleItems.map((item: EquipmentAvailabilityResult) => {
                    const qty = selectedQty[item.id] ?? 0
                    const isSelected = qty > 0
                    return (
                      <div
                        key={item.id}
                        className={`overflow-hidden rounded-xl border transition ${
                          isSelected
                            ? 'border-slate-900 ring-2 ring-slate-900 dark:border-white dark:ring-white'
                            : 'border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className='h-32 w-full object-cover'
                          />
                        ) : (
                          <div className='flex h-32 items-center justify-center bg-slate-100 dark:bg-slate-800'>
                            <span className='material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600'>photo_camera</span>
                          </div>
                        )}
                        <div className='p-4'>
                          <p className='text-xs font-semibold capitalize text-slate-400 dark:text-slate-500'>{item.type}</p>
                          <p className='font-semibold text-slate-900 dark:text-white'>{item.name}</p>
                          <p className='mt-0.5 text-xs text-slate-500 dark:text-slate-400'>
                            {item.available} disponible{item.available !== 1 ? 's' : ''}
                          </p>
                          <div className='mt-3 flex items-center gap-2'>
                            <button
                              type='button'
                              disabled={qty === 0}
                              onClick={() => setItemQty(item.id, qty - 1, item.available)}
                              className='flex size-8 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-50 disabled:opacity-30 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800'
                              aria-label={`Quitar un ${item.name}`}
                            >
                              <span className='material-symbols-outlined text-[18px]'>remove</span>
                            </button>
                            <span className='w-6 text-center text-sm font-bold text-slate-900 dark:text-white'>
                              {qty}
                            </span>
                            <button
                              type='button'
                              disabled={qty >= item.available}
                              onClick={() => setItemQty(item.id, qty + 1, item.available)}
                              className='flex size-8 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-50 disabled:opacity-30 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800'
                              aria-label={`Agregar un ${item.name}`}
                            >
                              <span className='material-symbols-outlined text-[18px]'>add</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className='mt-8 flex flex-wrap justify-between gap-3'>
              <button type='button' onClick={() => setStep(2)} className='rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-600 dark:text-slate-300'>
                Atrás
              </button>
              <button
                type='button'
                onClick={goNextFromStep3}
                disabled={totalSelected === 0 || availabilityLoading}
                className='rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200'
              >
                {totalSelected > 0 ? `Continuar con ${totalSelected} ítem${totalSelected !== 1 ? 's' : ''}` : 'Continuar'}
              </button>
            </div>
          </section>
        )}

        {/* ── Step 4 — datos de contacto ── */}
        {step === 4 && (
          <section className='rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
            <h2 className='text-lg font-bold text-slate-900 dark:text-white'>4 · Tus datos y solicitud</h2>
            <div className='mt-1'>
              <p className='text-xs font-medium text-slate-500 dark:text-slate-400'>
                {formatWindow(windowStr.start, windowStr.end)}
              </p>
              {totalSelected > 0 && (
                <ul className='mt-1 space-y-0.5'>
                  {Object.entries(selectedQty).map(([id, qty]) => {
                    const item = availabilityRows.find((r) => r.id === id)
                    if (!item) return null
                    return (
                      <li key={id} className='text-xs text-slate-500 dark:text-slate-400'>
                        · {item.name}{qty > 1 ? ` ×${qty}` : ''}
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
            <form className='mt-6 space-y-4' onSubmit={handleSubmit}>
              <div className='grid gap-4 sm:grid-cols-2'>
                <div>
                  <label className={labelCls} htmlFor='g-name'>Nombre completo *</label>
                  <input
                    id='g-name'
                    type='text'
                    value={contactName}
                    onChange={(e) => {
                      setContactName(e.target.value)
                      setContactErrors((prev) => ({ ...prev, contactName: undefined }))
                    }}
                    aria-invalid={Boolean(contactErrors.contactName)}
                    aria-describedby={contactErrors.contactName ? 'g-name-err' : undefined}
                    className={`${inputCls} ${contactErrors.contactName ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : ''}`}
                  />
                  {contactErrors.contactName && (
                    <p id='g-name-err' role='alert' className='mt-1 text-xs text-red-600 dark:text-red-400'>
                      {contactErrors.contactName}
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelCls} htmlFor='g-email'>Correo *</label>
                  <input
                    id='g-email'
                    type='email'
                    value={contactEmail}
                    onChange={(e) => {
                      setContactEmail(e.target.value)
                      setContactErrors((prev) => ({ ...prev, contactEmail: undefined }))
                    }}
                    aria-invalid={Boolean(contactErrors.contactEmail)}
                    aria-describedby={contactErrors.contactEmail ? 'g-email-err' : undefined}
                    className={`${inputCls} ${contactErrors.contactEmail ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : ''}`}
                  />
                  {contactErrors.contactEmail && (
                    <p id='g-email-err' role='alert' className='mt-1 text-xs text-red-600 dark:text-red-400'>
                      {contactErrors.contactEmail}
                    </p>
                  )}
                </div>
              </div>

              <div className='grid gap-4 sm:grid-cols-2'>
                <div>
                  <label className={labelCls} htmlFor='g-phone'>Teléfono *</label>
                  <input
                    id='g-phone'
                    type='tel'
                    value={contactPhone}
                    onChange={(e) => {
                      setContactPhone(e.target.value)
                      setContactErrors((prev) => ({ ...prev, contactPhone: undefined }))
                    }}
                    placeholder='Ej. +52 55 1234 5678'
                    aria-invalid={Boolean(contactErrors.contactPhone)}
                    aria-describedby={contactErrors.contactPhone ? 'g-phone-err' : undefined}
                    className={`${inputCls} ${contactErrors.contactPhone ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : ''}`}
                  />
                  {contactErrors.contactPhone && (
                    <p id='g-phone-err' role='alert' className='mt-1 text-xs text-red-600 dark:text-red-400'>
                      {contactErrors.contactPhone}
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelCls} htmlFor='g-company'>Empresa (opcional)</label>
                  <input
                    id='g-company'
                    type='text'
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className={inputCls}
                    placeholder='Productora o agencia'
                  />
                </div>
              </div>

              <div className='grid gap-4 sm:grid-cols-2'>
                <div>
                  <label className={labelCls} htmlFor='g-pax'>Número de personas *</label>
                  <input
                    id='g-pax'
                    type='number'
                    min={1}
                    value={paxCount}
                    onChange={(e) => {
                      setPaxCount(Number(e.target.value))
                      setContactErrors((prev) => ({ ...prev, paxCount: undefined }))
                    }}
                    aria-invalid={Boolean(contactErrors.paxCount)}
                    aria-describedby={contactErrors.paxCount ? 'g-pax-err' : undefined}
                    className={`${inputCls} ${contactErrors.paxCount ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : ''}`}
                  />
                  {contactErrors.paxCount && (
                    <p id='g-pax-err' role='alert' className='mt-1 text-xs text-red-600 dark:text-red-400'>
                      {contactErrors.paxCount}
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelCls} htmlFor='g-budget'>Presupuesto aprox. (opcional)</label>
                  <div className='relative'>
                    <span className='absolute inset-y-0 left-3 flex items-center text-slate-400'>$</span>
                    <input
                      id='g-budget'
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
                  id='g-invoice'
                  type='checkbox'
                  checked={requiresInvoice}
                  onChange={(e) => setRequiresInvoice(e.target.checked)}
                  className='size-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:ring-offset-slate-900'
                />
                <label htmlFor='g-invoice' className='text-sm font-medium text-slate-700 dark:text-slate-300'>
                  Requiere factura fiscal
                </label>
              </div>

              <div>
                <label className={labelCls} htmlFor='g-notes'>Notas adicionales</label>
                <textarea
                  id='g-notes'
                  rows={3}
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value)
                    setContactErrors((prev) => ({ ...prev, notes: undefined }))
                  }}
                  placeholder='Detalles de producción, equipo extra, etc.'
                  aria-invalid={Boolean(contactErrors.notes)}
                  aria-describedby={contactErrors.notes ? 'g-notes-err' : undefined}
                  className={`${inputCls} resize-none ${contactErrors.notes ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : ''}`}
                />
                {contactErrors.notes && (
                  <p id='g-notes-err' role='alert' className='mt-1 text-xs text-red-600 dark:text-red-400'>
                    {contactErrors.notes}
                  </p>
                )}
              </div>
              <div className='flex flex-wrap justify-between gap-3 pt-2'>
                <button type='button' onClick={goBackFromStep4} className='rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-600 dark:text-slate-300'>
                  Atrás
                </button>
                <button
                  type='submit'
                  disabled={isSubmitting}
                  className='flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200'
                >
                  {isSubmitting && (
                    <span className='material-symbols-outlined animate-spin text-[16px]'>progress_activity</span>
                  )}
                  {isSubmitting ? 'Enviando…' : 'Enviar solicitud'}
                </button>
              </div>
            </form>
          </section>
        )}
      </div>
    </div>
  )
}
