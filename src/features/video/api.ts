import { apiClient } from '../../services/apiClient'
import type { VideoTokenResponse } from '../../types/api'

export function requestVideoToken(appointmentId: string) {
  return apiClient<VideoTokenResponse>(`/api/v1/video/appointments/${appointmentId}/token`, {
    method: 'POST',
  })
}
