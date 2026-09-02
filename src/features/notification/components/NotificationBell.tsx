import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { queryKeys } from '../../../services/queryKeys'
import { unreadNotificationCount } from '../api'
import { cn } from '../../../lib/cn'

export function NotificationBell() {
  const queryClient = useQueryClient()
  const unreadQuery = useQuery({
    queryKey: queryKeys.unreadNotifications,
    queryFn: unreadNotificationCount,
    refetchInterval: 30_000,
  })
  const unread = unreadQuery.data?.unreadCount ?? 0

  return (
    <Link
      to="/notificacoes"
      aria-label={unread > 0 ? `${unread} notificações não lidas` : 'Notificações'}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      onClick={() => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.notifications })
      }}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
        <path d="M9 17a3 3 0 0 0 6 0" />
      </svg>
      {unread > 0 ? (
        <span
          className={cn(
            'absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-red-600 px-1 text-center text-[10px] font-semibold leading-4 text-white',
          )}
        >
          {unread > 9 ? '9+' : unread}
        </span>
      ) : null}
    </Link>
  )
}
