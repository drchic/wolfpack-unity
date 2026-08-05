import type { ButtonHTMLAttributes } from 'react'

export type ButtonVariant = 'primary' | 'ghost' | 'danger'

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold text-sm px-5 py-2.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-bg hover:bg-accent-hi',
  ghost: 'border border-edge text-ink hover:border-accent hover:text-accent',
  danger: 'border border-danger/50 text-danger hover:bg-danger/10',
}

export function buttonClasses(variant: ButtonVariant = 'primary', className = '') {
  return `${base} ${variants[variant]} ${className}`
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

export function Button({ variant = 'primary', className = '', ...props }: Props) {
  return <button className={buttonClasses(variant, className)} {...props} />
}
