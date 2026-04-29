import { createFileRoute } from '@tanstack/react-router'
import { ClientLayout } from '@/features/cliente-portal'

export const Route = createFileRoute('/cliente')({
  component: ClientPortalLayout,
})

/** Layout wrapper that guards the entire /cliente subtree for authenticated clients. */
function ClientPortalLayout() {
  return <ClientLayout />
}
