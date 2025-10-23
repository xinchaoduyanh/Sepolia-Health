import { apiClient } from '../api-client'

// Types for auth API - matching BE DTOs
export interface AdminLoginRequest {
    email: string
    password: string
}

export interface AdminLoginResponse {
    accessToken: string
    refreshToken: string
    admin: {
        id: number
        email: string
        phone: string | null
        role: string
        status: string
        createdAt: string
        updatedAt: string
    }
}

export interface AdminProfile {
    id: number
    email: string
    phone: string | null
    role: string
    status: string
    createdAt: string
    updatedAt: string
}

export interface RefreshTokenRequest {
    refreshToken: string
}

export interface RefreshTokenResponse {
    accessToken: string
    refreshToken: string
}

export interface LogoutResponse {
    message: string
}

export class AuthService {
    /**
     * Admin login - gọi proxy route
     */
    async login(credentials: AdminLoginRequest): Promise<AdminProfile> {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // Include cookies
            body: JSON.stringify(credentials),
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.message || errorData.error || 'Login failed')
        }

        return response.json()
    }

    /**
     * Refresh access token - gọi proxy route
     */
    async refreshToken(): Promise<{ success: boolean }> {
        const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            credentials: 'include', // Include cookies
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Token refresh failed')
        }

        return response.json()
    }

    /**
     * Get current admin profile - gọi proxy route
     */
    async getProfile(): Promise<AdminProfile> {
        const response = await fetch('/api/profile', {
            method: 'GET',
            credentials: 'include', // Include cookies
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to get profile')
        }

        return response.json()
    }

    /**
     * Admin logout - gọi proxy route
     */
    async logout(): Promise<LogoutResponse> {
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include', // Include cookies
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Logout failed')
        }

        return response.json()
    }
}

export const authService = new AuthService()
