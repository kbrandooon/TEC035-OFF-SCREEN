import { createFileRoute } from '@tanstack/react-router'
import { LeadsTable } from '@/features/crm-leads/components/leads-table'
import { useAuth } from '@/features/auth'

/**
 * Route for the Leads Pipeline (CRM).
 * Accessible only to authenticated tenant members.
 */
export const Route = createFileRoute('/dashboard/leads')({
  component: LeadsPage,
})

function LeadsPage() {
  const { session } = useAuth()
  const tenantId = session?.user?.app_metadata?.tenant_id as string | undefined

  if (!tenantId) {
    return (
      <div className='flex h-[60vh] items-center justify-center'>
        <p className='text-slate-500'>No se encontró un tenant activo.</p>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-bold text-slate-900 dark:text-white'>Pipeline de Leads</h1>
        <p className='text-slate-500'>Gestiona y califica las solicitudes entrantes de WhatsApp, Instagram y Web.</p>
      </div>
      
      <LeadsTable tenantId={tenantId} />
    </div>
  )
}
