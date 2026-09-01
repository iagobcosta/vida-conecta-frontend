import { useAuthStore } from '../stores/authStore'
import type { BackendApiError } from '../types/api'

const API_BASE = import.meta.env.VITE_API_URL ?? ''

export class ApiError extends Error {
  readonly status: number
  readonly details: string[]

  constructor(status: number, message: string, details: string[] = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
}

export async function apiClient<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers: initHeaders, ...rest } = options
  const headers = new Headers(initHeaders)
  const token = useAuthStore.getState().token

  if (body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (!response.ok) {
    const payload = await parseError(response)
    if (response.status === 401) {
      useAuthStore.getState().clearSession()
    }
    throw new ApiError(response.status, payload.message, payload.details)
  }

  if (response.status === 204) {
    return undefined as T
  }

  const text = await response.text()
  if (!text) {
    return undefined as T
  }
  return JSON.parse(text) as T
}

async function parseError(response: Response) {
  try {
    const payload = (await response.json()) as BackendApiError
    const details = payload.details ?? []
    const message = payload.message || defaultMessage(response.status)
    return { message, details }
  } catch {
    return { message: defaultMessage(response.status), details: [] as string[] }
  }
}

function defaultMessage(status: number) {
  if (status === 401) {
    return 'Sessão expirada. Entre novamente.'
  }
  if (status === 403) {
    return 'Você não tem permissão para esta ação.'
  }
  if (status === 404) {
    return 'Recurso não encontrado.'
  }
  return 'Não foi possível concluir a operação.'
}
