import { apiRequest, clearCsrfToken, refreshCsrfToken } from '@/shared/api/api-client'

export type AuthenticatedUser = {
  publicId: string
  username: string
  email: string
  role: 'USER' | 'ADMIN'
  emailVerified: boolean
}

export type RegisterPayload = {
  username: string
  email: string
  password: string
}

export const authApi = {
  initialize: async () => {
    await refreshCsrfToken()
    return apiRequest<AuthenticatedUser>('/api/auth/me')
  },
  login: async (username: string, password: string) => {
    await refreshCsrfToken()
    await apiRequest<void>('/api/auth/login', {
      method: 'POST',
      body: new URLSearchParams({ username, password }),
    })
    clearCsrfToken()
    await refreshCsrfToken()
    return apiRequest<AuthenticatedUser>('/api/auth/me')
  },
  register: async (payload: RegisterPayload) => {
    await refreshCsrfToken()
    return apiRequest<AuthenticatedUser>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
  logout: async () => {
    await apiRequest<void>('/api/auth/logout', {
      method: 'POST',
    })
    clearCsrfToken()
  },
}
