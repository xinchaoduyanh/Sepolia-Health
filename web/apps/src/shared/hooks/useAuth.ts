'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useState } from 'react'
import { jwtDecode } from 'jwt-decode'
import { authService, type LoginRequest } from '../lib/api-services'
import { useAuthStore } from '../stores/auth.store'

interface JwtPayload {
    userId: number
    role: string
    exp: number
    iat: number
}

/**
 * Decode JWT token without verification (for client-side use)
 */
function decodeJWT(token: string): JwtPayload | null {
    try {
        return jwtDecode<JwtPayload>(token)
    } catch (error) {
        console.error('Failed to decode JWT:', error)
        return null
    }
}

/**
 * Hook for login
 */
export function useLogin() {
    const router = useRouter()
    const { login, setTokens } = useAuthStore()

    return useMutation({
        mutationFn: async (credentials: LoginRequest) => {
            const tokenResponse = await authService.login(credentials)
            const { accessToken, refreshToken } = tokenResponse

            if (!accessToken) {
                throw new Error('MISSING_ACCESS_TOKEN')
            }

            const decoded = decodeJWT(accessToken)
            if (!decoded) {
                throw new Error('INVALID_TOKEN')
            }

            setTokens({ accessToken, refreshToken })
            const userProfile = await authService.getProfile()
            return { tokens: { accessToken, refreshToken }, user: userProfile }
        },
        onSuccess: data => {
            const { tokens, user } = data
            login(user, tokens)
            // Redirect to home page, which will handle role-based routing
            router.push('/')
        },
    })
}

/**
 * Hook for logout
 */
export function useLogout() {
    const queryClient = useQueryClient()
    const router = useRouter()
    const { logout } = useAuthStore()

    return useMutation({
        mutationFn: async () => {
            await authService.logout()
        },
        onSettled: () => {
            // Clear auth data FIRST before navigation
            logout()
            queryClient.clear()
            // Then navigate to login
            router.replace('/login')
        },
    })
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
 * Flow: Check tokens -> Get profile
 * Token refresh is handled automatically by api-client interceptors on 401 errors
 */
export function useCheckAuth() {
    const authStore = useAuthStore()

    const checkAuth = React.useCallback(async () => {
        const { setUser, setLoading, hasTokens, logout, hasHydrated } = authStore

        if (!hasHydrated) {
            return
        }

        if (authStore.isAuthenticated && authStore.user && authStore.user.role) {
            return
        }

        setLoading(true)

        try {
            if (!hasTokens()) {
                setUser(null)
                return
            }

            // Fetch profile - API client will auto-refresh on 401 if needed
            const user = await authService.getProfile()
            setUser(user)
        } catch (error) {
            console.error('Failed to fetch profile:', error)
            logout()
        } finally {
            setLoading(false)
        }
    }, [authStore])

    return { checkAuth }
}

export function useResetPassword() {
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const params = useSearchParams()
    const email = params.get('email') || ''
    const otp = params.get('otp') || ''

    const mutation = useMutation({
        mutationFn: async () => {
            return authService.resetPassword({ email, otp, newPassword: password })
        },
    })

    const handleResetPassword = async () => {
        if (password.length < 6) {
            setError('Mật khẩu cần ít nhất 8 ký tự.')
            return
        }
        if (password !== confirm) {
            setError('Mật khẩu xác nhận không khớp.')
            return
        }
        await mutation.mutateAsync()
    }
    return {
        password,
        setPassword,
        confirm,
        setConfirm,
        showPassword,
        setShowPassword,
        showConfirm,
        setShowConfirm,
        handleResetPassword,
        error: mutation.error?.message || error,
        loading: mutation.isPending,
        success: mutation.isSuccess,
    }
}
