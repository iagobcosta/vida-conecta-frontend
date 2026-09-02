import { useToastStore } from '../stores/toastStore'
import { cn } from '../lib/cn'

export function ToastViewport() {
  const toasts = useToastStore((state) => state.toasts)
  const dismiss = useToastStore((state) => state.dismiss)

  if (toasts.length === 0) {
    return null
  }

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-[min(24rem,calc(100%-2rem))] flex-col gap-2">
      {toasts.map((toast) => (
        <p
          key={toast.id}
          role="status"
          className={cn(
            'pointer-events-auto rounded-lg px-4 py-3 text-sm shadow-lg',
            toast.tone === 'success' && 'bg-teal-800 text-white',
            toast.tone === 'error' && 'bg-red-700 text-white',
            toast.tone === 'info' && 'bg-slate-800 text-white',
          )}
        >
          <span>{toast.message}</span>
          <button
            type="button"
            className="ml-3 underline decoration-white/50"
            onClick={() => dismiss(toast.id)}
          >
            Fechar
          </button>
        </p>
      ))}
    </div>
  )
}
