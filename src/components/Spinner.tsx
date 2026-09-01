import { cn } from '../lib/cn'

export function Spinner({ className, label = 'Carregando' }: { className?: string; label?: string }) {
  return (
    <div className={cn('flex items-center justify-center gap-2 text-sm text-slate-600', className)} role="status">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-teal-700" aria-hidden />
      <span>{label}</span>
    </div>
  )
}
