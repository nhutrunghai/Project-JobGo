import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { logout as logoutRequest } from '../../api/authService.js'
import { refreshAccessToken } from '../../api/tokenRefresh.js'
import { getMyProfile } from '../../api/userService.js'
import { clearClientAuthSession, hasAccessToken } from '../../config/api.js'
import { useFavoriteStore } from '../../stores/useFavoriteStore.js'
import { AuthContext } from './AuthContext.js'
import { queryKeys } from '../../lib/queryKeys.js'

export function AuthProvider({ children }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isAuthenticated, setIsAuthenticated] = useState(hasAccessToken)
  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const clearSession = useCallback(() => {
    clearClientAuthSession()
    setProfile(null)
    setIsAuthenticated(false)
    queryClient.removeQueries({ queryKey: queryKeys.profile.me })
    queryClient.removeQueries({ queryKey: queryKeys.profile.detail })
    useFavoriteStore.getState().clear()
  }, [queryClient])

  const refreshSession = useCallback(async ({ force = true } = {}) => {
    setIsLoading(true)

    try {
      if (!hasAccessToken()) await refreshAccessToken()
      const nextProfile = await queryClient.fetchQuery({
        queryKey: queryKeys.profile.me,
        queryFn: () => getMyProfile({ force: true, redirectOnUnauthorized: false }),
        staleTime: force ? 0 : 30000,
      })
      setProfile(nextProfile)
      setIsAuthenticated(true)
      return nextProfile
    } catch {
      clearSession()
      return null
    } finally {
      setIsLoading(false)
    }
  }, [clearSession, queryClient])

  useEffect(() => {
    void refreshSession({ force: false })
  }, [refreshSession])

  useEffect(() => {
    const ownerId = profile?.id || profile?._id || ''

    if (isAuthenticated && ownerId) {
      void useFavoriteStore.getState().hydrate(ownerId)
      return
    }

    useFavoriteStore.getState().clear()
  }, [isAuthenticated, profile?.id, profile?._id])

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
    } finally {
      clearSession()
      navigate('/login')
    }
  }, [clearSession, navigate])

  const value = useMemo(() => {
    const name = profile?.fullName || profile?.username || 'Tài khoản người dùng'
    const handle = profile?.username ? `@${profile.username}` : '@mycoder-user'

    return {
      isAuthenticated,
      profile,
      profileName: name,
      profileHandle: handle,
      profileAvatar: profile?.avatar || '',
      isLoading,
      refreshSession,
      logout,
    }
  }, [isAuthenticated, profile, isLoading, refreshSession, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
