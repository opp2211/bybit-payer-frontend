import { apiRequest, clearCsrfToken, refreshCsrfToken } from '@/shared/api/api-client'

export type AuthenticatedUser = {
  username: string
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
  logout: async () => {
    await apiRequest<void>('/api/auth/logout', {
      method: 'POST',
    })
    clearCsrfToken()
  },
}
