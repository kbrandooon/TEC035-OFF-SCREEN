import type { LeadSource } from '../types'

interface SourceBadgeProps {
  source: LeadSource
}

/**
 * Renders a small icon + label identifying the lead acquisition source.
 */
export function LeadSourceBadge({ source }: SourceBadgeProps) {
  const config = {
    whatsapp: {
      label: 'WhatsApp',
      icon: 'chat',
      color: 'text-emerald-600 dark:text-emerald-400',
    },
    instagram: {
      label: 'Instagram',
      icon: 'photo_camera',
      color: 'text-pink-600 dark:text-pink-400',
    },
    web: {
      label: 'Web',
      icon: 'language',
      color: 'text-slate-600 dark:text-slate-400',
    },
  }

  const { label, icon, color } = config[source] || config.web

  return (
    <div className='flex items-center gap-1.5'>
      <span className={`material-symbols-outlined text-[16px] ${color}`}>
        {icon}
      </span>
      <span className='text-sm text-slate-600 dark:text-slate-400'>{label}</span>
    </div>
  )
}
