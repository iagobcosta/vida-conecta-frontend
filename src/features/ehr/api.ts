import { apiClient } from '../../services/apiClient'
import type { ClinicalNoteResponse, CreateClinicalNoteRequest, EhrAuditResponse } from '../../types/api'

export function listClinicalNotes(patientId: string, appointmentId?: string) {
  const query = appointmentId ? `?appointmentId=${encodeURIComponent(appointmentId)}` : ''
  return apiClient<ClinicalNoteResponse[]>(`/api/v1/patients/${patientId}/ehr${query}`)
}

export function createClinicalNote(patientId: string, payload: CreateClinicalNoteRequest) {
  return apiClient<ClinicalNoteResponse>(`/api/v1/patients/${patientId}/ehr`, {
    method: 'POST',
    body: payload,
  })
}

export function listEhrAudit(patientId: string) {
  return apiClient<EhrAuditResponse[]>(`/api/v1/ehr/audit?patientId=${encodeURIComponent(patientId)}`)
}
