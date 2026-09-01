import { apiClient } from '../../services/apiClient'
import type {
  AppointmentResponse,
  CreateAppointmentRequest,
  DoctorResponse,
} from '../../types/api'

export function listDoctors() {
  return apiClient<DoctorResponse[]>('/api/v1/doctors')
}

export function listAppointments() {
  return apiClient<AppointmentResponse[]>('/api/v1/appointments')
}

export function getAppointment(id: string) {
  return apiClient<AppointmentResponse>(`/api/v1/appointments/${id}`)
}

export function createAppointment(payload: CreateAppointmentRequest) {
  return apiClient<AppointmentResponse>('/api/v1/appointments', { method: 'POST', body: payload })
}

export function confirmAppointment(id: string) {
  return apiClient<AppointmentResponse>(`/api/v1/appointments/${id}/confirm`, { method: 'POST' })
}

export function cancelAppointment(id: string) {
  return apiClient<AppointmentResponse>(`/api/v1/appointments/${id}/cancel`, { method: 'POST' })
}
