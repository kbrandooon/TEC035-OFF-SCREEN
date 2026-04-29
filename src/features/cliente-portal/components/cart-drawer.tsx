import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useAuth } from '@/features/auth'
import { createClientReservation } from '../api/create-client-reservation'
import { useCartCtx } from '../context/cart-context'

/**
 * Slide-out cart drawer.
 * Renders over the page without navigation. Opened via `toggleCart()` in the context.
 */
export function CartDrawer() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { items, removeItem, clearCart, total, isCartOpen, closeCart } =
    useCartCtx()
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
            startTime: item.startTime ?? '09:00',
            endTime: item.endTime ?? '18:00',
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
      closeCart()
      toast.success('¡Orden confirmada!', {
        description: 'Tus reservas están pendientes de confirmación.',
      })
      navigate({ to: '/cliente' })
    } catch (err) {
      toast.error('Error al confirmar', {
        description: err instanceof Error ? err.message : 'Intenta de nuevo.',
      })
    } finally {
      setIsConfirming(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      {isCartOpen && (
        <div
          className='fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]'
          onClick={closeCart}
        />
      )}

      {/* Drawer panel */}
      <div
        className={`fixed top-0 right-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          isCartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className='flex items-center justify-between border-b border-slate-200 px-5 py-4'>
          <div>
            <h2 className='text-lg font-bold text-slate-900'>
              Carrito de Compras
            </h2>
            <p className='text-xs text-slate-400'>
              {items.length === 0
                ? 'Sin ítems'
                : `${items.length} ${items.length === 1 ? 'ítem' : 'ítems'}`}
            </p>
          </div>
          <button
            onClick={closeCart}
            className='flex size-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700'
          >
            <span className='material-symbols-outlined text-[20px]'>close</span>
          </button>
        </div>

        {/* Empty state */}
        {items.length === 0 ? (
          <div className='flex flex-1 flex-col items-center justify-center gap-3 text-slate-400'>
            <span className='material-symbols-outlined text-[52px]'>
              shopping_cart
            </span>
            <p className='text-sm font-medium'>Tu carrito está vacío</p>
            <button
              onClick={closeCart}
              className='mt-1 text-xs text-slate-500 underline hover:text-slate-800'
            >
              Explorar equipos
            </button>
          </div>
        ) : (
          <>
            {/* Items list */}
            <div className='flex flex-1 flex-col gap-3 overflow-y-auto px-5 py-4'>
              {items.map((item) => (
                <div
                  key={`${item.equipment.id}-${item.startDate}-${item.endDate}`}
                  className='flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3'
                >
                  {/* Image */}
                  <div className='size-16 shrink-0 overflow-hidden rounded-lg bg-slate-200'>
                    {item.equipment.image_url ? (
                      <img
                        src={item.equipment.image_url}
                        alt={item.equipment.name}
                        className='size-full object-cover'
                      />
                    ) : (
                      <div className='flex size-full items-center justify-center'>
                        <span className='material-symbols-outlined text-[24px] text-slate-300'>
                          videocam
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className='min-w-0 flex-1'>
                    <p className='truncate text-sm font-semibold text-slate-900'>
                      {item.equipment.name}
                    </p>
                    <p className='text-xs text-slate-400'>
                      {item.equipment.tenant_name}
                    </p>
                    <p className='mt-1 flex items-center gap-1 text-xs text-slate-500'>
                      <span className='material-symbols-outlined text-[12px]'>
                        calendar_today
                      </span>
                      {item.startDate} → {item.endDate} · {item.days}d
                    </p>
                    <p className='mt-1 text-sm font-bold text-slate-800'>
                      $
                      {item.subtotal.toLocaleString('en-MX', {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() =>
                      removeItem(
                        item.equipment.id,
                        item.startDate,
                        item.endDate
                      )
                    }
                    className='shrink-0 text-slate-300 transition-colors hover:text-red-500'
                  >
                    <span className='material-symbols-outlined text-[18px]'>
                      delete
                    </span>
                  </button>
                </div>
              ))}
            </div>

            {/* Order summary + actions */}
            <div className='border-t border-slate-200 px-5 py-4'>
              <div className='mb-3 flex flex-col gap-1.5 text-sm'>
                <div className='flex justify-between border-t border-slate-100 pt-1.5 font-bold text-slate-900'>
                  <span>Total</span>
                  <span className='text-slate-900'>
                    $
                    {total.toLocaleString('en-MX', {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              <button
                onClick={() => void handleConfirmOrder()}
                disabled={isConfirming}
                className='flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-bold text-white transition-colors hover:bg-slate-700 disabled:opacity-60'
              >
                {isConfirming ? 'Confirmando...' : 'Confirmar Orden →'}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
