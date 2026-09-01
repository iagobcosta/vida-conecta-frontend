import { apiClient } from '../../services/apiClient'
import type {
  AdminRegisterResponse,
  BootstrapTokenResponse,
  CompleteDoctorRequest,
  DoctorInvitePreviewResponse,
  DoctorInviteResponse,
  InviteDoctorRequest,
  LoginRequest,
  ManagedDoctorResponse,
  MeResponse,
  RegisterAdminRequest,
  RegisterRequest,
  TokenResponse,
} from '../../types/api'

export function login(payload: LoginRequest) {
  return apiClient<TokenResponse>('/api/v1/auth/login', { method: 'POST', body: payload })
}

export function register(payload: RegisterRequest) {
  return apiClient<TokenResponse>('/api/v1/auth/register', { method: 'POST', body: payload })
}

export function registerAdmin(payload: RegisterAdminRequest) {
  return apiClient<AdminRegisterResponse>('/api/v1/auth/register/admin', { method: 'POST', body: payload })
}

export function completeDoctorRegistration(payload: CompleteDoctorRequest) {
  return apiClient<TokenResponse>('/api/v1/auth/register/doctor', { method: 'POST', body: payload })
}

export function previewDoctorInvite(token: string) {
  return apiClient<DoctorInvitePreviewResponse>(`/api/v1/auth/invites/${token}`)
}

export function fetchMe() {
  return apiClient<MeResponse>('/api/v1/auth/me')
}

export function fetchBootstrapToken() {
  return apiClient<BootstrapTokenResponse>('/api/v1/admin/bootstrap-token')
}

export function inviteDoctor(payload: InviteDoctorRequest) {
  return apiClient<DoctorInviteResponse>('/api/v1/admin/doctors/invites', { method: 'POST', body: payload })
}

export function listDoctorInvites() {
  return apiClient<DoctorInviteResponse[]>('/api/v1/admin/doctors/invites')
}

export function listManagedDoctors() {
  return apiClient<ManagedDoctorResponse[]>('/api/v1/admin/doctors')
}
