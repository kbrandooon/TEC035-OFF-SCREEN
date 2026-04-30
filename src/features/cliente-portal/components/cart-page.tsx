import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useAuth } from '@/features/auth'
import { createClientReservation } from '../api/create-client-reservation'
import { useCartCtx } from '../context/cart-context'

/**
 * Cart page: shows all items the client has added along with an order summary.
 * "Confirmar Orden" creates a reservation row per item in the reservations table.
 */
export function CartPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { items, removeItem, clearCart, total } = useCartCtx()
  const [isConfirming, setIsConfirming] = useState(false)

  const handleConfirmOrder = async () => {
    if (!user || items.length === 0) return
    setIsConfirming(true)
    try {
      await Promise.all(
        items.map((item) =>
          createClientReservation({
            clientProfileId: user.id,
            equipmentId: item.equipment.id,
            tenantId: item.equipment.tenant_id,
            startDate: item.startDate,
            endDate: item.endDate,
            startTime: item.startTime,
            endTime: item.endTime,
            equipmentItem: {
              name: item.equipment.name,
              quantity: 1,
              image_url: item.equipment.image_url ?? '',
              daily_rate: item.equipment.daily_rate,
              equipmentId: item.equipment.id,
            },
          })
        )
      )
      clearCart()
      toast.success('¡Orden confirmada!', {
        description:
          'Tus reservas están pendientes de confirmación por el estudio.',
      })
      navigate({ to: '/cliente' })
    } catch (err) {
      toast.error('Error al confirmar la orden', {
        description: err instanceof Error ? err.message : 'Intenta de nuevo.',
      })
    } finally {
      setIsConfirming(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className='mx-auto flex max-w-7xl flex-col items-center justify-center gap-4 px-6 py-24 text-center'>
        <span className='material-symbols-outlined text-[64px] text-slate-300'>
          shopping_cart
        </span>
        <h2 className='text-xl font-bold text-slate-800'>
          Tu carrito está vacío
        </h2>
        <p className='text-sm text-slate-500'>
          Explora el catálogo y añade equipos para rentar.
        </p>
        <Link
          to='/cliente'
          className='mt-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-slate-700'
        >
          Explorar Equipos
        </Link>
      </div>
    )
  }

  const tax = total * 0.16

  return (
    <div className='mx-auto max-w-5xl px-6 py-8'>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-slate-900'>
          Carrito de Compras
        </h1>
        <p className='text-sm text-slate-500'>
          Revisa tus equipos seleccionados para renta antes de confirmar.
        </p>
      </div>

      <div className='flex flex-col gap-6 lg:flex-row'>
        {/* ── Cart items ──────────────────────────── */}
        <div className='flex flex-1 flex-col gap-3'>
          {items.map((item) => (
            <div
              key={`${item.equipment.id}-${item.startDate}-${item.endDate}`}
              className='flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm'
            >
              {/* Image */}
              <div className='size-20 shrink-0 overflow-hidden rounded-lg bg-slate-100'>
                {item.equipment.image_url ? (
                  <img
                    src={item.equipment.image_url}
                    alt={item.equipment.name}
                    className='size-full object-cover'
                  />
                ) : (
                  <div className='flex size-full items-center justify-center'>
                    <span className='material-symbols-outlined text-[28px] text-slate-300'>
                      videocam
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className='min-w-0 flex-1'>
                <div className='flex items-start justify-between gap-2'>
                  <div>
                    <p className='font-semibold text-slate-900'>
                      {item.equipment.name}
                    </p>
                    <p className='text-xs text-slate-400'>
                      {item.equipment.tenant_name}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      removeItem(
                        item.equipment.id,
                        item.startDate,
                        item.endDate
                      )
                    }
                    className='shrink-0 text-slate-400 transition-colors hover:text-red-500'
                  >
                    <span className='material-symbols-outlined text-[20px]'>
                      delete
                    </span>
                  </button>
                </div>

                <div className='mt-2 flex items-center justify-between'>
                  <div className='flex items-center gap-1.5 text-xs text-slate-500'>
                    <span className='material-symbols-outlined text-[14px]'>
                      calendar_today
                    </span>
                    {item.startDate} – {item.endDate} ({item.days}{' '}
                    {item.days === 1 ? 'día' : 'días'})
                  </div>
                  <p className='font-bold text-slate-900'>
                    $
                    {item.subtotal.toLocaleString('en-MX', {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Order summary ────────────────────────── */}
        <div className='w-full lg:w-72 lg:shrink-0'>
          <div className='rounded-xl border border-slate-200 bg-white p-5 shadow-sm'>
            <h2 className='mb-4 text-base font-bold text-slate-900'>
              Resumen del Pedido
            </h2>

            <div className='flex flex-col gap-2.5 text-sm'>
              <div className='flex justify-between text-slate-600'>
                <span>Subtotal</span>
                <span>
                  ${total.toLocaleString('en-MX', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className='flex justify-between text-slate-600'>
                <span>Impuestos (16%)</span>
                <span>
                  ${tax.toLocaleString('en-MX', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className='my-1 border-t border-slate-100' />
              <div className='flex justify-between font-bold text-slate-900'>
                <span>Total</span>
                <span className='text-base text-blue-600'>
                  $
                  {(total + tax).toLocaleString('en-MX', {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            <button
              onClick={() => void handleConfirmOrder()}
              disabled={isConfirming}
              className='mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-bold text-white transition-colors hover:bg-slate-700 disabled:opacity-60'
            >
              {isConfirming ? 'Confirmando...' : 'Confirmar Orden →'}
            </button>

            <Link
              to='/cliente'
              className='mt-2.5 flex w-full items-center justify-center rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50'
            >
              Seguir comprando
            </Link>

            <div className='mt-4 flex items-center justify-center gap-4 text-[11px] text-slate-400'>
              <span className='flex items-center gap-1'>
                <span className='material-symbols-outlined text-[13px]'>
                  lock
                </span>
                Pago Seguro
              </span>
              <span className='flex items-center gap-1'>
                <span className='material-symbols-outlined text-[13px]'>
                  verified
                </span>
                Garantía AV
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
