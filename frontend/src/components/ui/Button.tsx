import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'ghost' | 'danger'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold text-sm px-5 py-2.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50'

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-bg hover:bg-accent-hi',
  ghost: 'border border-edge text-ink hover:border-accent hover:text-accent',
  danger: 'border border-danger/50 text-danger hover:bg-danger/10',
}

export function Button({ variant = 'primary', className = '', ...props }: Props) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />
}
