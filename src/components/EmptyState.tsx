import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

type EmptyStateProps = {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center', className)}>
      <p className="text-base font-medium text-slate-800">{title}</p>
      {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  )
}
