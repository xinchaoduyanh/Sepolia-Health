import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import React from 'react'
import { authService, type AdminLoginRequest } from '../lib/api-services'
import { queryKeys } from '../lib/query-keys'
import { useAuthStore } from '../stores/auth.store'
import { config } from '../lib/config'

/**
 * Hook for admin login
 */
export function useAdminLogin() {
    const queryClient = useQueryClient()
    const router = useRouter()
    const { login } = useAuthStore()

    return useMutation({
        mutationFn: async (credentials: AdminLoginRequest) => {
            const response = await authService.login(credentials)
            return response
        },
        onSuccess: (data: any) => {
            console.log('🔐 Login response data:', data)

            // Extract user data and tokens from response
            // Now data should already be normalized by auth service
            const { admin, accessToken, refreshToken } = data

            console.log('🔐 Extracted tokens:', { accessToken: !!accessToken, refreshToken: !!refreshToken })
            console.log('🔐 Extracted admin:', admin)

            // Set admin data and tokens in Zustand store
            login(admin, { accessToken, refreshToken })

            // Set admin data in query cache
            queryClient.setQueryData(queryKeys.auth.me(), admin)
            queryClient.setQueryData(queryKeys.auth.profile(), admin)

            // Redirect to dashboard immediately
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
        mutationFn: async () => {
            // Clear localStorage first (Zustand store)
            console.log('🔐 Clearing local state...')
            logout()
            queryClient.clear()

            // Call API logout (don't care about response)
            try {
                await authService.logout()
            } catch (error) {
                console.error('Logout API call failed:', error)
                // Don't care about API response, continue
            }
        },
        onSuccess: () => {
            // Redirect to login page
            router.push('/login')
        },
        onError: () => {
            // Even if logout fails, redirect to login
            router.push('/login')
        },
    })
}

/**
 * Hook for refreshing access token
 */
export function useRefreshToken() {
    const queryClient = useQueryClient()
    const { logout, setAccessToken, setTokens } = useAuthStore()

    return useMutation({
        mutationFn: async () => {
            const response = await authService.refreshToken()
            return response
        },
        onSuccess: (data: any) => {
            // Update tokens in store
            if (data.accessToken) {
                setAccessToken(data.accessToken)
            }
            if (data.accessToken && data.refreshToken) {
                setTokens({
                    accessToken: data.accessToken,
                    refreshToken: data.refreshToken,
                })
            }
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
 * Only used when we need to refresh user data
 */
export function useAdminProfile() {
    const { setUser, setError } = useAuthStore()

    const query = useQuery({
        queryKey: queryKeys.auth.profile(),
        queryFn: () => authService.getProfile(),
        enabled: false, // Disable automatic fetching
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: 1,
    })

    // Handle success and error
    React.useEffect(() => {
        if (query.data) {
            setUser(query.data)
        }
        if (query.error) {
            console.error('Profile fetch error:', query.error)
            setError(query.error.message)
            // Only redirect if it's a 401 error (unauthorized)
            if (query.error.message?.includes('401') || query.error.message?.includes('Unauthorized')) {
                if (typeof window !== 'undefined') {
                    window.location.href = '/login'
                }
            }
        }
    }, [query.data, query.error, setUser, setError])

    return query
}

/**
 * Hook for checking if user is authenticated
 * Simplified - no automatic profile fetching
 */
export function useAuth() {
    const { user, isAuthenticated, isLoading, error } = useAuthStore()

    // Ensure boolean values
    const safeIsAuthenticated = Boolean(isAuthenticated)
    const safeIsLoading = Boolean(isLoading)

    // User data is complete if we have user with role
    const isUserDataComplete = user && user.role

    return {
        user,
        isLoading: safeIsLoading,
        isAuthenticated: safeIsAuthenticated && isUserDataComplete,
        error,
    }
}

/**
 * Hook to check authentication status from server
 * This should be called on app initialization - ONE TIME ONLY
 * Flow: Check tokens -> Get profile -> Refresh if needed -> Redirect
 */
export function useCheckAuth() {
    const authStore = useAuthStore()

    const checkAuth = React.useCallback(async () => {
        const { setUser, setLoading, hasTokens, accessToken, refreshToken, logout, setAccessToken } = authStore
        console.log('🔍 Checking authentication status...')
        setLoading(true)

        try {
            // Step 1: Check if we have tokens
            if (!hasTokens()) {
                console.log('❌ No tokens found')
                setUser(null)
                setLoading(false)
                return
            }

            console.log('✅ Tokens found, checking profile...')

            // Step 2: Try to get profile with current access token
            try {
                const response = await fetch(`${config.apiUrl}/auth/me`, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                })

                console.log('📡 Profile API response status:', response.status)

                if (response.ok) {
                    const responseData = await response.json()
                    console.log('✅ Profile check successful:', responseData)

                    // Normalize response - extract data from nested structure
                    const userData = responseData.data || responseData
                    console.log('✅ Normalized user data:', userData)

                    // Extract admin data if it's nested
                    const finalUserData = userData.admin || userData
                    console.log('✅ Final user data:', finalUserData)

                    setUser(finalUserData)
                    setLoading(false)
                    return
                }
            } catch (profileError) {
                console.error('Profile check failed:', profileError)
            }

            // Step 3: If profile failed, try to refresh token (only once)
            console.log('🔄 Profile failed, attempting token refresh...')

            if (!refreshToken) {
                console.log('❌ No refresh token available')
                logout()
                setLoading(false)
                return
            }

            try {
                const refreshResponse = await fetch(`${config.apiUrl}/auth/refresh`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${refreshToken}`,
                        'Content-Type': 'application/json',
                    },
                })

                if (refreshResponse.ok) {
                    const refreshResponseData = await refreshResponse.json()
                    console.log('✅ Token refresh successful:', refreshResponseData)

                    // Normalize response - extract data from nested structure
                    const refreshData = refreshResponseData.data || refreshResponseData
                    console.log('✅ Normalized refresh data:', refreshData)

                    // Update tokens in store
                    if (refreshData.accessToken) {
                        setAccessToken(refreshData.accessToken)
                    }

                    // Try profile again with new token
                    const newToken = refreshData.accessToken || accessToken
                    const profileResponse = await fetch(`${config.apiUrl}/auth/me`, {
                        headers: {
                            Authorization: `Bearer ${newToken}`,
                            'Content-Type': 'application/json',
                        },
                    })

                    if (profileResponse.ok) {
                        const profileResponseData = await profileResponse.json()
                        console.log('✅ Profile check successful after refresh:', profileResponseData)

                        // Normalize response - extract data from nested structure
                        const userData = profileResponseData.data || profileResponseData
                        const finalUserData = userData.admin || userData
                        console.log('✅ Final user data after refresh:', finalUserData)
                        console.log('✅ Normalized user data after refresh:', userData)

                        setUser(finalUserData)
                        setLoading(false)
                        return
                    }
                }
            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError)
            }

            // Step 4: If everything failed, logout
            console.log('❌ All authentication attempts failed, logging out')
            logout()
        } catch (error) {
            console.error('Auth check failed:', error)
            logout()
        } finally {
            setLoading(false)
        }
    }, [authStore])

    return { checkAuth }
}
