import { createFileRoute } from '@tanstack/react-router'
import { MarketplacePage } from '@/features/cliente-portal'

export const Route = createFileRoute('/cliente/')({
  component: MarketplacePage,
})
