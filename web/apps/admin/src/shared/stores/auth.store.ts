import { get } from 'http'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Types matching BE DTOs
export interface User {
    id: number
    email: string
    phone: string | null
    role: string
    status: string
    createdAt: string
    updatedAt: string
}

export interface TokenPair {
    accessToken: string
    refreshToken: string
}

interface AuthState {
    user: User | null
    accessToken: string | null
    refreshToken: string | null
    isAuthenticated: boolean
    isLoading: boolean
    error: string | null
    hasHydrated: boolean // Track if store has been rehydrated from localStorage
}

interface AuthActions {
    setUser: (user: User | null) => void
    setTokens: (tokens: TokenPair) => void
    setAccessToken: (token: string) => void
    setLoading: (loading: boolean) => void
    setError: (error: string | null) => void
    login: (user: User, tokens: TokenPair) => void
    logout: () => void
    clearError: () => void
    hasTokens: () => boolean
}

type AuthStore = AuthState & AuthActions

export const useAuthStore = create<AuthStore>()(
    persist(
        (set, get) => ({
            // Initial state - isLoading should be true on app startup
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: true,
            error: null,
            hasHydrated: false,

            // Actions
            setUser: (user: User | null) => {
                console.log('🔄 Setting user:', user)
                if (!user) {
                    console.log('⚠️ Setting user to null - this might clear authentication')
                    console.trace('⚠️ setUser(null) called from:') // Stack trace
                }
                set({
                    user,
                    isAuthenticated: !!user,
                    error: null,
                })
            },

            setTokens: (tokens: TokenPair) => {
                console.log('🔑 Setting tokens')
                set({
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken,
                })
            },

            setAccessToken: (token: string) => {
                console.log('🔑 Setting access token')
                set({ accessToken: token })
            },

            setLoading: (loading: boolean) => set({ isLoading: loading }),

            setError: (error: string | null) => set({ error, isLoading: false }),

            login: (user: User, tokens: TokenPair) => {
                console.log('🔐 Login user:', user)
                set({
                    user,
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken,
                    isAuthenticated: true,
                    isLoading: false,
                    error: null,
                })
            },

            logout: () => {
                console.log('🚪 Logout user - clearing all tokens and user data')
                console.trace('🚪 Logout called from:') // Stack trace để biết ai gọi logout
                set({
                    user: null,
                    accessToken: null,
                    refreshToken: null,
                    isAuthenticated: false,
                    isLoading: false,
                    error: null,
                })
            },

            clearError: () => set({ error: null }),

            hasTokens: () => {
                const state = get()
                return !!(state.accessToken && state.refreshToken)
            },
        }),
        {
            name: 'auth-storage',
            partialize: state => ({
                user: state.user,
                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
                isAuthenticated: state.isAuthenticated,
                hasHydrated: state.hasHydrated,
            }),
            // Add rehydration options
            onRehydrateStorage: () => state => {
                console.log('🔄 Rehydrating auth store from localStorage...')
                console.log('🔄 Raw state from localStorage:', state)

                if (state) {
                    console.log('🔄 Rehydrated state details:', {
                        hasUser: !!state.user,
                        hasAccessToken: !!state.accessToken,
                        hasRefreshToken: !!state.refreshToken,
                        isAuthenticated: state.isAuthenticated,
                        userRole: state.user?.role,
                        tokenPreview: state.accessToken?.substring(0, 20) + '...',
                    })

                    // Fix inconsistent state after rehydration
                    if (state.isAuthenticated && (!state.user || !state.accessToken || !state.refreshToken)) {
                        console.log('🔧 Fixing inconsistent state: missing user or tokens')
                        state.isAuthenticated = false
                        state.isLoading = false // Set loading to false to prevent infinite loading
                    }
                    // If we have user but missing role, don't immediately mark as not authenticated
                    // Let the auth check handle this properly
                    if (state.user && !state.user.role) {
                        console.log('⚠️ User missing role after rehydration, will check with server')
                        // Don't change isAuthenticated here, let useCheckAuth handle it
                    }
                } else {
                    console.log('❌ No state found in localStorage')
                }

                // Mark as hydrated and set loading to false after rehydration completes
                if (state) {
                    state.hasHydrated = true
                    state.isLoading = false
                }
                console.log('✅ Auth store rehydration completed')
            },
        },
    ),
)
