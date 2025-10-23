import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import React from 'react'
import { authService, type AdminLoginRequest, type AdminProfile } from '../lib/api-services'
import { queryKeys } from '../lib/query-keys'
import { useAuthStore } from '../stores/auth.store'

/**
 * Hook for admin login
 */
export function useAdminLogin() {
    const queryClient = useQueryClient()
    const router = useRouter()
    const { login } = useAuthStore()

    return useMutation({
        mutationFn: (credentials: AdminLoginRequest) => authService.login(credentials),
        onSuccess: (data: AdminProfile) => {
            // Set admin data in Zustand store (tokens are handled by cookies)
            login(data)

            // Set admin data in query cache
            queryClient.setQueryData(queryKeys.auth.me(), data)
            queryClient.setQueryData(queryKeys.auth.profile(), data)

            // Redirect to dashboard
            router.push('/dashboard')
        },
        onError: error => {
            console.error('Login failed:', error)
        },
    })
}

/**
 * Hook for admin logout
 */
export function useAdminLogout() {
    const queryClient = useQueryClient()
    const router = useRouter()
    const { logout } = useAuthStore()

    return useMutation({
        mutationFn: () => authService.logout(),
        onSuccess: () => {
            // Clear all query cache
            queryClient.clear()

            // Clear Zustand store
            logout()

            // Redirect to login
            router.push('/login')
        },
        onError: error => {
            console.error('Logout failed:', error)
            // Even if logout fails on server, clear local state
            logout()
            router.push('/login')
        },
    })
}

/**
 * Hook for refreshing access token
 */
export function useRefreshToken() {
    const queryClient = useQueryClient()
    const { logout } = useAuthStore()

    return useMutation({
        mutationFn: () => authService.refreshToken(),
        onSuccess: () => {
            // Tokens are automatically handled by cookies
            console.log('Token refreshed successfully')
        },
        onError: error => {
            console.error('Token refresh failed:', error)
            // If refresh fails, logout user
            queryClient.clear()
            logout()
            if (typeof window !== 'undefined') {
                window.location.href = '/login'
            }
        },
    })
}

/**
 * Hook for getting current admin profile
 */
export function useAdminProfile() {
    const { setUser, setError, isAuthenticated } = useAuthStore()

    const query = useQuery({
        queryKey: queryKeys.auth.profile(),
        queryFn: () => authService.getProfile(),
        enabled: isAuthenticated, // Use isAuthenticated instead of accessToken
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: 1,
    })

    // Handle success and error
    React.useEffect(() => {
        if (query.data) {
            setUser(query.data)
        }
        if (query.error) {
            setError(query.error.message)
        }
    }, [query.data, query.error, setUser, setError])

    return query
}

/**
 * Hook for checking if user is authenticated
 */
export function useAuth() {
    const { user, isAuthenticated, isLoading, error } = useAuthStore()
    const { isLoading: profileLoading } = useAdminProfile()

    return {
        user,
        isLoading: isLoading || profileLoading,
        isAuthenticated,
        error,
    }
}

/**
 * Hook to check authentication status from server
 * This should be called on app initialization
 */
export function useCheckAuth() {
    const { setUser, setLoading } = useAuthStore()

    const checkAuth = React.useCallback(async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/profile')
            if (response.ok) {
                const userData = await response.json()
                setUser(userData)
            } else {
                setUser(null)
            }
        } catch (error) {
            console.error('Auth check failed:', error)
            setUser(null)
        } finally {
            setLoading(false)
        }
    }, [setUser, setLoading])

    return { checkAuth }
}
