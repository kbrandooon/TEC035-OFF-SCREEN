import { createFileRoute } from '@tanstack/react-router'
import { DashboardCalendar } from '@/features/reservas/components/dashboard-calendar'

export const Route = createFileRoute('/dashboard/')({
  component: DashboardCalendar,
})
