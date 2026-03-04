import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useAuth } from '@/features/auth'
import { createClientReservation } from '../api/create-client-reservation'
import { useCartCtx } from '../context/cart-context'
import { useEquipmentDetail } from '../hooks/use-equipment-detail'

const TYPE_LABEL: Record<string, string> = {
  camara: 'Cámaras de Cine',
  lente: 'Lentes',
  iluminacion: 'Iluminación',
  audio: 'Audio',
  tramoya: 'Grip',
  estudio: 'Estudio',
  video: 'Video',
  otros_accesorios: 'Accesorios',
}

interface Props {
  equipmentId: string
}

/**
 * Detail page for a single equipment item.
 * Shows the image, specs, date/time pickers, availability, pricing, and booking actions.
 *
 * @param equipmentId - UUID from the route param.
 */
export function EquipmentDetailPage({ equipmentId }: Props) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { addItem } = useCartCtx()
  const {
    equipment,
    imageUrl,
    isLoading,
    error,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    days,
    total,
    isAvailable,
    isCheckingAvailability,
  } = useEquipmentDetail(equipmentId)

  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('18:00')

  const typeLabel = equipment
    ? (TYPE_LABEL[equipment.type] ?? equipment.type)
    : ''
  const today = new Date().toISOString().split('T')[0]

  const handleAddToCart = () => {
    if (!equipment) return
    addItem(equipment, startDate, endDate, startTime, endTime)
    toast.success('Añadido al carrito')
  }

  const handleRentNow = async () => {
    if (!equipment || !user) return
    try {
      await createClientReservation({
        clientProfileId: user.id,
        equipmentId: equipment.id,
        tenantId: equipment.tenant_id,
        startDate,
        endDate,
        startTime,
        endTime,
        equipmentItem: {
          name: equipment.name,
          quantity: 1,
          image_url: equipment.image_url ?? '',
          daily_rate: equipment.daily_rate,
          equipmentId: equipment.id,
        },
      })
      toast.success('¡Reserva creada!', {
        description: 'Tu solicitud está pendiente de confirmación.',
      })
      navigate({ to: '/cliente' })
    } catch (err) {
      toast.error('Error al crear la reserva', {
        description: err instanceof Error ? err.message : 'Intenta de nuevo.',
      })
    }
  }

  if (isLoading) {
    return (
      <div className='flex h-96 items-center justify-center'>
        <div className='size-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-800' />
      </div>
    )
  }

  if (error || !equipment) {
    return (
      <div className='flex h-96 flex-col items-center justify-center gap-3 text-slate-400'>
        <span className='material-symbols-outlined text-[48px]'>error</span>
        <p>No se pudo cargar el equipo.</p>
        <Link
          to='/cliente'
          className='text-sm text-slate-600 hover:text-slate-900'
        >
          ← Regresar al catálogo
        </Link>
      </div>
    )
  }

  const availabilityBadge = isCheckingAvailability
    ? { label: 'Verificando...', cls: 'bg-slate-100 text-slate-500' }
    : isAvailable === true
      ? { label: 'DISPONIBLE', cls: 'bg-emerald-50 text-emerald-600' }
      : isAvailable === false
        ? { label: 'NO DISPONIBLE', cls: 'bg-red-50 text-red-600' }
        : null

  return (
    <div className='mx-auto max-w-6xl px-6 py-8'>
      {/* Breadcrumb */}
      <nav className='mb-6 flex items-center gap-2 text-sm text-slate-500'>
        <Link to='/cliente' className='hover:text-slate-800'>
          Inicio
        </Link>
        <span className='material-symbols-outlined text-[14px]'>
          chevron_right
        </span>
        <span>{typeLabel}</span>
        <span className='material-symbols-outlined text-[14px]'>
          chevron_right
        </span>
        <span className='font-medium text-slate-800'>{equipment.name}</span>
      </nav>

      <div className='flex flex-col gap-10 lg:flex-row'>
        {/* ── Left: image ─────────────────────────────── */}
        <div className='flex-1'>
          <div className='aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100 shadow-sm'>
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={equipment.name}
                className='size-full object-cover'
              />
            ) : (
              <div className='flex size-full items-center justify-center'>
                <span className='material-symbols-outlined text-[80px] text-slate-300'>
                  videocam
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Right: detail + booking ──────────────────── */}
        <div className='w-full lg:w-96 lg:shrink-0'>
          {/* Availability + type */}
          <div className='mb-3 flex items-center gap-2'>
            {availabilityBadge && (
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase ${availabilityBadge.cls}`}
              >
                {availabilityBadge.label}
              </span>
            )}
          </div>

          <h1 className='mb-2 text-3xl font-bold text-slate-900'>
            {equipment.name}
          </h1>

          {equipment.description && (
            <p className='mb-6 text-sm leading-relaxed text-slate-500'>
              {equipment.description}
            </p>
          )}

          {/* Booking card */}
          <div className='rounded-xl border border-slate-200 bg-white p-5 shadow-sm'>
            {/* Price */}
            <div className='mb-5'>
              <span className='text-3xl font-bold text-slate-900'>
                ${equipment.daily_rate.toLocaleString()}
              </span>
              <span className='text-sm text-slate-400'> / día</span>
            </div>

            {/* Date pickers */}
            <div className='mb-3 grid grid-cols-2 gap-3'>
              <div>
                <label className='mb-1 block text-[11px] font-bold tracking-wider text-slate-500 uppercase'>
                  Fecha Inicio
                </label>
                <input
                  type='date'
                  value={startDate}
                  min={today}
                  onChange={(e) => setStartDate(e.target.value)}
                  className='w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-1 focus:ring-slate-400 focus:outline-none'
                />
              </div>
              <div>
                <label className='mb-1 block text-[11px] font-bold tracking-wider text-slate-500 uppercase'>
                  Fecha Fin
                </label>
                <input
                  type='date'
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className='w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-1 focus:ring-slate-400 focus:outline-none'
                />
              </div>
            </div>

            {/* Time pickers */}
            <div className='mb-4 grid grid-cols-2 gap-3'>
              <div>
                <label className='mb-1 block text-[11px] font-bold tracking-wider text-slate-500 uppercase'>
                  Hora Inicio
                </label>
                <input
                  type='time'
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className='w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-1 focus:ring-slate-400 focus:outline-none'
                />
              </div>
              <div>
                <label className='mb-1 block text-[11px] font-bold tracking-wider text-slate-500 uppercase'>
                  Hora Fin
                </label>
                <input
                  type='time'
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className='w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-1 focus:ring-slate-400 focus:outline-none'
                />
              </div>
            </div>

            {/* Duration + total */}
            <div className='mb-5 flex items-center justify-between rounded-lg bg-slate-50 px-4 py-2.5 text-sm'>
              <span className='text-slate-500'>
                Duración: {days} {days === 1 ? 'día' : 'días'}
              </span>
              <span className='font-bold text-slate-900'>
                Total: ${total.toLocaleString()}
              </span>
            </div>

            {/* Actions */}
            <button
              onClick={() => void handleRentNow()}
              disabled={!isAvailable || isCheckingAvailability}
              className='mb-2 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-bold text-white shadow transition-colors hover:bg-slate-700 disabled:opacity-50'
            >
              <span className='material-symbols-outlined text-[18px]'>
                bolt
              </span>
              Alquilar Ahora
            </button>

            <button
              onClick={handleAddToCart}
              disabled={!isAvailable || isCheckingAvailability}
              className='flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50'
            >
              <span className='material-symbols-outlined text-[18px]'>
                add_shopping_cart
              </span>
              Añadir al Carrito
            </button>
          </div>

          {/* Studio info */}
          <div className='mt-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3'>
            <div className='flex size-10 items-center justify-center rounded-full bg-slate-100'>
              <span className='material-symbols-outlined text-[20px] text-slate-500'>
                domain
              </span>
            </div>
            <div>
              <p className='text-sm font-semibold text-slate-900'>
                {equipment.tenant_name}
              </p>
              <p className='text-xs text-slate-400'>Proveedor Verificado</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
