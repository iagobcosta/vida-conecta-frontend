import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

type FieldProps = {
  id: string
  label: string
  error?: string
  hint?: string
  children: ReactNode
  className?: string
}

export function Field({ id, label, error, hint, children, className }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5 text-left', className)}>
      <label htmlFor={id} className="text-sm font-medium text-slate-800">
        {label}
      </label>
      {children}
      {hint && !error ? (
        <p id={`${id}-hint`} className="text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export const inputClassName =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-700'
