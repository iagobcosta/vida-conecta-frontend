import { apiClient } from '../../services/apiClient'
import type { NotificationResponse, UnreadCountResponse } from '../../types/api'

export function listNotifications() {
  return apiClient<NotificationResponse[]>('/api/v1/notifications')
}

export function unreadNotificationCount() {
  return apiClient<UnreadCountResponse>('/api/v1/notifications/unread-count')
}

export function markNotificationRead(id: string) {
  return apiClient<NotificationResponse>(`/api/v1/notifications/${id}/read`, { method: 'POST' })
}

export function markAllNotificationsRead() {
  return apiClient<void>('/api/v1/notifications/read-all', { method: 'POST' })
}
