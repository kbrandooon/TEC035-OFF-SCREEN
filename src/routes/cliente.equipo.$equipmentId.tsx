import { createFileRoute } from '@tanstack/react-router'
import { EquipmentDetailPage } from '@/features/cliente-portal'

export const Route = createFileRoute('/cliente/equipo/$equipmentId')({
  component: EquipmentDetailRoute,
})

function EquipmentDetailRoute() {
  const { equipmentId } = Route.useParams()
  return <EquipmentDetailPage equipmentId={equipmentId} />
}
