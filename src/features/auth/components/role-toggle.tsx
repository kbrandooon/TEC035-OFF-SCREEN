import type { SignupRole } from '../api/sign-up-with-email'

interface RoleToggleProps {
  /** Currently selected role */
  value: SignupRole
  /** Fires when the user clicks a role option */
  onChange: (role: SignupRole) => void
  /** Disables the toggle while a form is submitting */
  disabled?: boolean
}

const OPTIONS: { label: string; value: SignupRole }[] = [
  { label: 'Cliente', value: 'cliente' },
  { label: 'Estudio', value: 'estudio' },
]

/**
 * Segmented control that lets the user choose their account role.
 *
 * Renders two pill-style buttons sharing a single animated background slider,
 * clearly communicating the currently selected option.
 */
export function RoleToggle({ value, onChange, disabled }: RoleToggleProps) {
  return (
    <div
      role='group'
      aria-label='Tipo de cuenta'
      className='relative flex w-full rounded-xl bg-slate-100 p-1 shadow-inner'
    >
      {/* Animated sliding pill */}
      <div
        aria-hidden='true'
        className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-white shadow-sm transition-transform duration-300 ease-in-out ${
          value === 'estudio' ? 'translate-x-[calc(100%+8px)]' : 'translate-x-0'
        }`}
      />

      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type='button'
          role='radio'
          aria-checked={value === opt.value}
          disabled={disabled}
          onClick={() => onChange(opt.value)}
          className={`relative z-10 flex-1 rounded-lg py-2 text-sm font-semibold transition-colors duration-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
            value === opt.value
              ? 'text-slate-900'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
