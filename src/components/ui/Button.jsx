import Spinner from './Spinner'

const VARIANTS = {
  primary:
    'bg-gradient-brand text-white shadow-lg shadow-violet/25 hover:shadow-violet/45 hover:brightness-110',
  secondary: 'bg-surface-2 text-ink border border-line hover:border-violet/60 hover:bg-surface',
  ghost: 'text-muted hover:text-ink hover:bg-surface-2',
}

const SIZES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition
        duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
        ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {loading && <Spinner size={16} />}
      {children}
    </button>
  )
}