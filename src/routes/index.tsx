import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: () => (
    <div className="p-4 flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold">OFF SCREEN</h1>
      <p>Welcome to the new project.</p>
    </div>
  ),
})
