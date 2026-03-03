import { createFileRoute, Outlet } from '@tanstack/react-router'

// Pathless layout route for /equipo — renders either the list (index) or the detail child.
export const Route = createFileRoute('/equipo')({
  component: () => <Outlet />,
})
