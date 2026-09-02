import { apiClient } from '../../services/apiClient'
import type { AdminInsightsResponse } from '../../types/api'

export function fetchAdminInsights() {
  return apiClient<AdminInsightsResponse>('/api/v1/admin/insights')
}
