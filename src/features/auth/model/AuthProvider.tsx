import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react'

import { authApi, type AuthenticatedUser } from '@/features/auth/api/auth-api'
import { AuthContext, type AuthStatus } from '@/features/auth/model/auth-context'
import { AUTH_UNAUTHORIZED_EVENT } from '@/shared/api/api-client'

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<AuthenticatedUser | null>(null)

  const becomeAnonymous = useCallback(() => {
    setUser(null)
    setStatus('anonymous')
    queryClient.clear()
  }, [queryClient])

  useEffect(() => {
    let active = true

    const initialize = async () => {
      try {
        const authenticatedUser = await authApi.initialize()
        if (!active) return
        setUser(authenticatedUser)
        setStatus('authenticated')
      } catch {
        if (active) becomeAnonymous()
      }
    }

    const handleUnauthorized = () => becomeAnonymous()
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized)
    void initialize()

    return () => {
      active = false
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized)
    }
  }, [becomeAnonymous])

  const login = useCallback(async (username: string, password: string) => {
    const authenticatedUser = await authApi.login(username, password)
    setUser(authenticatedUser)
    setStatus('authenticated')
  }, [])

  const logout = useCallback(async () => {
    await authApi.logout()
    becomeAnonymous()
  }, [becomeAnonymous])

  const value = useMemo(() => ({ status, user, login, logout }), [status, user, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
