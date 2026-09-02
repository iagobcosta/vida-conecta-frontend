import { apiClient } from '../../services/apiClient'
import type { CreatePrescriptionRequest, PrescriptionResponse } from '../../types/api'

export function listPrescriptions() {
  return apiClient<PrescriptionResponse[]>('/api/v1/prescriptions')
}

export function createPrescription(payload: CreatePrescriptionRequest) {
  return apiClient<PrescriptionResponse>('/api/v1/prescriptions', { method: 'POST', body: payload })
}
