import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { CartItem, MarketplaceEquipment } from '../types'

interface CartContextValue {
  items: CartItem[]
  addItem: (
    eq: MarketplaceEquipment,
    startDate: string,
    endDate: string,
    startTime: string,
    endTime: string
  ) => void
  removeItem: (equipmentId: string, startDate: string, endDate: string) => void
  clearCart: () => void
  total: number
  count: number
  /** Global search query for the marketplace. Written by the navbar, read by useMarketplace. */
  search: string
  setSearch: (q: string) => void
  /** Whether the cart drawer is open. */
  isCartOpen: boolean
  toggleCart: () => void
  closeCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

/**
 * Provides shared cart state to all client portal pages.
 * Must wrap the `<ClientLayout>` or any subtree that needs cart access.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const CART_KEY = 'offscreen_client_cart'
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_KEY)
      return stored ? (JSON.parse(stored) as CartItem[]) : []
    } catch {
      return []
    }
  })
  const [search, setSearch] = useState('')
  const [isCartOpen, setIsCartOpen] = useState(false)
  const toggleCart = () => setIsCartOpen((v) => !v)
  const closeCart = () => setIsCartOpen(false)

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items))
  }, [items])

  const addItem = useCallback(
    (
      equipment: MarketplaceEquipment,
      startDate: string,
      endDate: string,
      startTime = '08:00',
      endTime = '18:00'
    ) => {
      const days = Math.max(
        1,
        Math.ceil(
          (new Date(endDate).getTime() - new Date(startDate).getTime()) /
            86_400_000
        )
      )
      const item: CartItem = {
        equipment,
        startDate,
        endDate,
        startTime,
        endTime,
        days,
        subtotal: equipment.daily_rate * days,
      }
      setItems((prev) => {
        const without = prev.filter(
          (c) =>
            !(
              c.equipment.id === equipment.id &&
              c.startDate === startDate &&
              c.endDate === endDate
            )
        )
        return [...without, item]
      })
    },
    []
  )

  const removeItem = useCallback(
    (equipmentId: string, startDate: string, endDate: string) => {
      setItems((prev) =>
        prev.filter(
          (c) =>
            !(
              c.equipment.id === equipmentId &&
              c.startDate === startDate &&
              c.endDate === endDate
            )
        )
      )
    },
    []
  )

  const clearCart = useCallback(() => setItems([]), [])
  const total = items.reduce((sum, i) => sum + i.subtotal, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        clearCart,
        total,
        count: items.length,
        search,
        setSearch,
        isCartOpen,
        toggleCart,
        closeCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

/**
 * Consumes the shared cart context.
 * Must be used inside a `<CartProvider>`.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useCartCtx(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCartCtx must be used inside <CartProvider>')
  return ctx
}
