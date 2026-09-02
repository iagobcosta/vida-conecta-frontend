import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

type AlertProps = {
  children: ReactNode
  variant?: 'info' | 'error' | 'success' | 'warning'
  className?: string
}

export function Alert({ children, variant = 'info', className }: AlertProps) {
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={cn(
        'rounded-lg px-3 py-2.5 text-sm',
        variant === 'info' && 'bg-teal-50 text-teal-900',
        variant === 'error' && 'bg-red-50 text-red-800',
        variant === 'success' && 'bg-emerald-50 text-emerald-900',
        variant === 'warning' && 'bg-amber-50 text-amber-900',
        className,
      )}
    >
      {children}
    </div>
  )
}
