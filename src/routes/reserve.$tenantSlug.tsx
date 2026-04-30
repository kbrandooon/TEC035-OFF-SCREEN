import { useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { useAuth } from '@/features/auth'
import { ReserveFlowPage, ReserveGoogleGate } from '@/features/studioos-reserve'
import { RESERVE_PREFILL_PHONE_KEY } from '@/features/studioos-reserve/constants'
import { coerceSearchPhoneToString } from '@/features/studioos-reserve/utils/coerce-search-phone'

const reserveSearchSchema = z
  .object({
    /** Opcional: teléfono desde enlace WhatsApp (ej. `?phone=525512345678`). */
    phone: z
      .unknown()
      .optional()
      .transform((v) => coerceSearchPhoneToString(v)),
  })
  .catch({ phone: undefined })

export const Route = createFileRoute('/reserve/$tenantSlug')({
  validateSearch: reserveSearchSchema,
  component: ReserveTenantRoute,
})

function persistPhoneFromSearch(phone: string | undefined) {
  const normalized = coerceSearchPhoneToString(phone)
  if (!normalized) return
  try {
    const decoded = decodeURIComponent(normalized)
    sessionStorage.setItem(RESERVE_PREFILL_PHONE_KEY, decoded)
  } catch {
    sessionStorage.setItem(RESERVE_PREFILL_PHONE_KEY, normalized)
  }
}

function ReserveTenantRoute() {
  const { tenantSlug } = Route.useParams()
  const { phone } = Route.useSearch()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    persistPhoneFromSearch(phone)
  }, [phone])

  if (isLoading) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950'>
        <span className='material-symbols-outlined animate-spin text-4xl text-slate-400'>
          progress_activity
        </span>
      </div>
    )
  }

  if (!user) {
    return <ReserveGoogleGate tenantSlug={tenantSlug} initialPhone={phone} />
  }

  return <ReserveFlowPage tenantSlug={tenantSlug} initialPhone={phone} />
}
