import { useEffect, useState } from 'react'
import { Outlet, Link } from '@tanstack/react-router'
import { supabase } from '@/supabase/client'
import { useAuth } from '@/features/auth'
import { CartProvider, useCartCtx } from '../context/cart-context'
import { CartDrawer } from './cart-drawer'

/**
 * Inner navbar — reads cart count from the shared CartContext.
 * Avatar shows initials from the client's first_name + last_name.
 * Must be rendered inside `<CartProvider>`.
 */
function ClientNavbar() {
  const { user } = useAuth()
  const { count, search, setSearch, toggleCart } = useCartCtx()
  const [initials, setInitials] = useState('CL')

  // Fetch the client profile name for the avatar initials
  useEffect(() => {
    if (!user) return
    supabase
      .from('client_profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.first_name && data?.last_name) {
          setInitials(`${data.first_name[0]}${data.last_name[0]}`.toUpperCase())
        } else if (user.email) {
          setInitials(user.email.slice(0, 2).toUpperCase())
        }
      })
  }, [user])

  return (
    <header className='sticky top-0 z-30 border-b border-slate-200 bg-white'>
      <div className='relative flex h-14 w-full items-center px-6'>
        {/* Logo */}
        <Link to='/cliente' className='flex shrink-0 items-center gap-2'>
          <div className='flex size-7 items-center justify-center rounded-md bg-slate-900'>
            <span className='material-symbols-outlined text-[15px] text-white'>
              videocam
            </span>
          </div>
          <span className='text-base font-bold tracking-tight text-slate-900'>
            Off Screen
          </span>
        </Link>

        {/* Search bar — absolutely centered */}
        <div className='absolute left-1/2 w-full max-w-sm -translate-x-1/2'>
          <span className='material-symbols-outlined absolute top-1/2 left-3 -translate-y-1/2 text-[18px] text-slate-400'>
            search
          </span>
          <input
            type='text'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Buscar cámaras, luces, sonido...'
            className='w-full rounded-lg bg-slate-100 py-2 pr-4 pl-9 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-1 focus:ring-slate-300 focus:outline-none'
          />
        </div>

        <div className='ml-auto flex items-center gap-3'>
          {/* Cart — opens slide-out drawer */}
          <button
            onClick={toggleCart}
            className='relative flex items-center justify-center rounded-full p-2 text-slate-600 transition-colors hover:bg-slate-100'
          >
            <span className='material-symbols-outlined text-[22px]'>
              shopping_cart
            </span>
            {count > 0 && (
              <span className='absolute -top-0.5 -right-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 py-px text-[10px] leading-none font-bold text-white'>
                {count}
              </span>
            )}
          </button>

          {/* User avatar — display only, sign-out is in the sidebar */}
          <div className='flex size-9 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white select-none'>
            {initials}
          </div>
        </div>
      </div>
    </header>
  )
}

/**
 * Top-level layout for all `/cliente` routes.
 * Wraps children in `CartProvider` so the navbar badge and all pages
 * share a single reactive cart state.
 */
export function ClientLayout() {
  return (
    <CartProvider>
      <div className='font-display flex min-h-screen flex-col bg-slate-50 text-slate-800'>
        <ClientNavbar />
        <div className='flex-1 bg-white'>
          <Outlet />
        </div>
      </div>
      {/* Cart drawer — rendered outside the page flow so it overlays everything */}
      <CartDrawer />
    </CartProvider>
  )
}
