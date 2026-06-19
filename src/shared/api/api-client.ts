import { API_BASE_URL } from '@/shared/config/env'

export const AUTH_UNAUTHORIZED_EVENT = 'flowpay:unauthorized'

export type ApiErrorPayload = {
  message?: string
  details?: string[]
}

type CsrfToken = {
  headerName: string
  token: string
}

let csrfToken: CsrfToken | null = null

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
    return new ApiError('Backend недоступен. Проверьте состояние сервера.', response.status)
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

export async function refreshCsrfToken(): Promise<void> {
  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}/api/auth/csrf`, {
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
    })
  } catch {
    throw new ApiError('Backend недоступен. Проверьте состояние сервера.', 0)
  }

  if (!response.ok) {
    throw await parseError(response)
  }

  csrfToken = (await response.json()) as CsrfToken
}

export function clearCsrfToken(): void {
  csrfToken = null
}

function requiresCsrf(method: string | undefined): boolean {
  return !['GET', 'HEAD', 'OPTIONS', 'TRACE'].includes((method ?? 'GET').toUpperCase())
}

function usesJsonBody(body: BodyInit | null | undefined): boolean {
  return typeof body === 'string'
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  if (requiresCsrf(init?.method) && !csrfToken) {
    await refreshCsrfToken()
  }

  for (let attempt = 0; attempt < 2; attempt += 1) {
    let response: Response

    try {
      response = await fetch(`${API_BASE_URL}${path}`, {
        ...init,
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          ...(usesJsonBody(init?.body) ? { 'Content-Type': 'application/json' } : {}),
          ...(requiresCsrf(init?.method) && csrfToken
            ? { [csrfToken.headerName]: csrfToken.token }
            : {}),
          ...init?.headers,
        },
      })
    } catch {
      throw new ApiError('Backend недоступен. Проверьте состояние сервера.', 0)
    }

    if (response.status === 403 && requiresCsrf(init?.method) && attempt === 0) {
      await refreshCsrfToken()
      continue
    }

    if (!response.ok) {
      if (response.status === 401) {
        window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT))
      }
      throw await parseError(response)
    }

    if (response.status === 204) {
      return undefined as T
    }

    return (await response.json()) as T
  }

  throw new ApiError('Не удалось подтвердить безопасность запроса.', 403)
}
