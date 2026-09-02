import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Alert } from '../../../components/Alert'
import { Button } from '../../../components/Button'
import { Card } from '../../../components/Card'
import { EmptyState } from '../../../components/EmptyState'
import { PageHeader } from '../../../components/PageHeader'
import { Spinner } from '../../../components/Spinner'
import { cn } from '../../../lib/cn'
import { errorMessage } from '../../../lib/errors'
import { formatDateTime, formatRelativeTime, notificationTypeLabel } from '../../../lib/formatters'
import { queryKeys } from '../../../services/queryKeys'
import { listNotifications, markAllNotificationsRead, markNotificationRead } from '../api'
import type { NotificationResponse } from '../../../types/api'

export function NotificationsPage() {
  const queryClient = useQueryClient()
  const listQuery = useQuery({
    queryKey: queryKeys.notifications,
    queryFn: listNotifications,
  })

  async function refreshInbox() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications }),
      queryClient.invalidateQueries({ queryKey: queryKeys.unreadNotifications }),
    ])
  }

  const readOne = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: refreshInbox,
  })
  const readAll = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: refreshInbox,
  })

  const items = listQuery.data ?? []
  const unread = items.filter((item) => !item.readAt).length

  return (
    <div>
      <PageHeader
        title="Notificações"
        description="Confirmações, cancelamentos com motivo, receitas e demais eventos da sua conta."
        actions={
          unread > 0 ? (
            <Button variant="secondary" disabled={readAll.isPending} onClick={() => readAll.mutate()}>
              {readAll.isPending ? 'Marcando…' : 'Marcar todas como lidas'}
            </Button>
          ) : undefined
        }
      />

      {listQuery.isPending ? <Spinner label="Carregando notificações" /> : null}
      {listQuery.isError ? <Alert variant="error">{errorMessage(listQuery.error)}</Alert> : null}
      {!listQuery.isPending && items.length === 0 ? (
        <EmptyState title="Nenhuma notificação" description="Quando houver um evento na agenda ou no prontuário, ele aparece aqui." />
      ) : null}

      <div className="space-y-3">
        {items.map((item) => (
          <NotificationCard
            key={item.id}
            item={item}
            marking={readOne.isPending}
            onRead={() => readOne.mutate(item.id)}
          />
        ))}
      </div>
    </div>
  )
}

function NotificationCard({
  item,
  marking,
  onRead,
}: {
  item: NotificationResponse
  marking: boolean
  onRead: () => void
}) {
  const unread = !item.readAt
  return (
    <Card className={cn(unread && 'border-teal-200 bg-teal-50/40')}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {notificationTypeLabel(item.type)}
          </p>
          <h2 className="mt-1 text-base font-semibold text-slate-900">{item.title}</h2>
          <p className="mt-1 text-sm text-slate-700">{item.body}</p>
          <p className="mt-2 text-xs text-slate-500">
            {formatDateTime(item.createdAt)} · {formatRelativeTime(item.createdAt)}
          </p>
        </div>
        {unread ? (
          <span className="rounded-full bg-teal-700 px-2 py-0.5 text-xs font-medium text-white">Nova</span>
        ) : null}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {item.actionPath && item.actionLabel ? (
          <Link to={item.actionPath} onClick={() => unread && onRead()}>
            <Button size="sm">{item.actionLabel}</Button>
          </Link>
        ) : null}
        {unread ? (
          <Button size="sm" variant="secondary" disabled={marking} onClick={onRead}>
            Marcar como lida
          </Button>
        ) : null}
      </div>
    </Card>
  )
}
