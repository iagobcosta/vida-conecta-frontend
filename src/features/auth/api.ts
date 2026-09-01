import { apiClient } from '../../services/apiClient'
import type { LoginRequest, MeResponse, RegisterRequest, TokenResponse } from '../../types/api'

export function login(payload: LoginRequest) {
  return apiClient<TokenResponse>('/api/v1/auth/login', { method: 'POST', body: payload })
}

export function register(payload: RegisterRequest) {
  return apiClient<TokenResponse>('/api/v1/auth/register', { method: 'POST', body: payload })
}

export function fetchMe() {
  return apiClient<MeResponse>('/api/v1/auth/me')
}
