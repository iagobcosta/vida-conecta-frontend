import { ApiError } from '../services/apiClient'

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

export function errorMessage(error: unknown, fallback = 'Não foi possível concluir a operação.') {
  if (isApiError(error)) {
    return error.message
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  return fallback
}
