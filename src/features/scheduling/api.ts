import { apiClient } from '../../services/apiClient'
import type {
  AppointmentResponse,
  AvailabilityResponse,
  AvailableSlotResponse,
  CreateAppointmentRequest,
  CreateAvailabilityRequest,
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

export function completeAppointment(id: string) {
  return apiClient<AppointmentResponse>(`/api/v1/appointments/${id}/complete`, { method: 'POST' })
}

export function listMyAvailability() {
  return apiClient<AvailabilityResponse[]>('/api/v1/me/availability')
}

export function createAvailability(payload: CreateAvailabilityRequest) {
  return apiClient<AvailabilityResponse>('/api/v1/me/availability', { method: 'POST', body: payload })
}

export function deleteAvailability(id: string) {
  return apiClient<void>(`/api/v1/me/availability/${id}`, { method: 'DELETE' })
}

export function listDoctorAvailability(doctorId: string) {
  return apiClient<AvailabilityResponse[]>(`/api/v1/doctors/${doctorId}/availability`)
}

export function listDoctorSlots(doctorId: string) {
  return apiClient<AvailableSlotResponse[]>(`/api/v1/doctors/${doctorId}/slots`)
}
