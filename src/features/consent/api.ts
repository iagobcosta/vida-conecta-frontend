import { apiClient } from '../../services/apiClient'
import type { ConsentResponse, GrantConsentRequest } from '../../types/api'

export function listConsents() {
  return apiClient<ConsentResponse[]>('/api/v1/consents')
}

export function grantConsent(payload: GrantConsentRequest) {
  return apiClient<ConsentResponse>('/api/v1/consents', { method: 'POST', body: payload })
}

export function revokeConsent(id: string) {
  return apiClient<ConsentResponse>(`/api/v1/consents/${id}/revoke`, { method: 'POST' })
}
