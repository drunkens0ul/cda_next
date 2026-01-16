'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import type { AuthUser, AuthContextType } from '@/lib/types/auth'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshSession = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/session')
      const data = await response.json()
      setUser(data.user)
    } catch (error) {
      console.error('Failed to refresh session:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/session', { method: 'DELETE' })
      setUser(null)
      // Reload the page to clear any cached state
      window.location.href = '/'
    } catch (error) {
      console.error('Failed to logout:', error)
    }
  }, [])

  const updateProfile = useCallback(async (firstName: string, lastName: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ firstName, lastName }),
      })

      const data = await response.json()

      if (data.success && data.user) {
        setUser(data.user)
        return true
      }

      return false
    } catch (error) {
      console.error('Failed to update profile:', error)
      return false
    }
  }, [])

  useEffect(() => {
    refreshSession()
  }, [refreshSession])

  // Refresh session periodically (every 5 minutes)
  useEffect(() => {
    const interval = setInterval(refreshSession, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [refreshSession])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        logout,
        refreshSession,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
