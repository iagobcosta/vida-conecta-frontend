import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../lib/cn'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60',
        size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2.5 text-sm',
        variant === 'primary' && 'bg-teal-700 text-white hover:bg-teal-800',
        variant === 'secondary' && 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50',
        variant === 'ghost' && 'text-teal-800 hover:bg-teal-50',
        variant === 'danger' && 'bg-red-700 text-white hover:bg-red-800',
        className,
      )}
      {...props}
    />
  )
}
