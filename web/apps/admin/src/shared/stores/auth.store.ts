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

interface AuthState {
    user: User | null
    isAuthenticated: boolean
    isLoading: boolean
    error: string | null
}

interface AuthActions {
    setUser: (user: User | null) => void
    setLoading: (loading: boolean) => void
    setError: (error: string | null) => void
    login: (user: User) => void
    logout: () => void
    clearError: () => void
}

type AuthStore = AuthState & AuthActions

export const useAuthStore = create<AuthStore>()(
    persist(
        (set, _get) => ({
            // Initial state
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            // Actions
            setUser: (user: User | null) =>
                set({
                    user,
                    isAuthenticated: !!user,
                    error: null,
                }),

            setLoading: (loading: boolean) => set({ isLoading: loading }),

            setError: (error: string | null) => set({ error, isLoading: false }),

            login: (user: User) =>
                set({
                    user,
                    isAuthenticated: true,
                    isLoading: false,
                    error: null,
                }),

            logout: () =>
                set({
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                    error: null,
                }),

            clearError: () => set({ error: null }),
        }),
        {
            name: 'auth-storage',
            partialize: state => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
        },
    ),
)
