import type { ReactNode } from 'react'
import { cn } from '../lib/cn'
import type { AppointmentStatus } from '../types/api'
import { appointmentStatusLabel } from '../lib/formatters'

type BadgeProps = {
  children: ReactNode
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
}

export function Badge({ children, tone = 'neutral', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        tone === 'neutral' && 'bg-slate-100 text-slate-700',
        tone === 'success' && 'bg-emerald-100 text-emerald-800',
        tone === 'warning' && 'bg-amber-100 text-amber-800',
        tone === 'danger' && 'bg-red-100 text-red-800',
        tone === 'info' && 'bg-teal-100 text-teal-800',
        className,
      )}
    >
      {children}
    </span>
  )
}

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  const tone =
    status === 'CONFIRMED' || status === 'IN_PROGRESS'
      ? 'success'
      : status === 'CANCELLED'
        ? 'danger'
        : status === 'COMPLETED'
          ? 'neutral'
          : 'warning'
  return <Badge tone={tone}>{appointmentStatusLabel(status)}</Badge>
}
