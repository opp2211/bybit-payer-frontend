import { API_BASE_URL } from '@/shared/config/env'

export type ApiErrorPayload = {
  message?: string
  details?: string[]
}

export class ApiError extends Error {
  readonly status: number
  readonly details: string[]

  constructor(message: string, status: number, details: string[] = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

async function parseError(response: Response): Promise<ApiError> {
  if ([502, 503, 504].includes(response.status)) {
    return new ApiError(
      'Backend недоступен. Проверьте, что локальный сервер запущен на порту 8080.',
      response.status,
    )
  }

  let payload: ApiErrorPayload = {}

  try {
    payload = (await response.json()) as ApiErrorPayload
  } catch {
    // The API may return an empty body for infrastructure-level failures.
  }

  return new ApiError(
    payload.message || `Сервер вернул ошибку ${response.status}`,
    response.status,
    payload.details ?? [],
  )
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
    })
  } catch {
    throw new ApiError(
      'Backend недоступен. Проверьте, что локальный сервер запущен на порту 8080.',
      0,
    )
  }

  if (!response.ok) {
    throw await parseError(response)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
