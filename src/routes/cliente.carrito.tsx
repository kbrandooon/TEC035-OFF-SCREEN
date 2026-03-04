import { createFileRoute } from '@tanstack/react-router'
import { CartPage } from '@/features/cliente-portal'

export const Route = createFileRoute('/cliente/carrito')({
  component: CartPage,
})
