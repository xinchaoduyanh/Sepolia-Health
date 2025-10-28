import { apiClient } from '../api-client'
import { config } from '../config'
import { normalizeApiResponse, normalizeApiError } from '../api-response-normalizer'

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
     * Admin login - gọi thẳng tới backend API
     */
    async login(credentials: AdminLoginRequest): Promise<AdminLoginResponse> {
        const response = await fetch(`${config.apiUrl}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(normalizeApiError(errorData))
        }

        const responseData = await response.json()

        // Normalize response structure using utility
        return normalizeApiResponse<AdminLoginResponse>(responseData)
    }

    /**
     * Refresh access token - gọi thẳng tới backend API
     */
    async refreshToken(): Promise<RefreshTokenResponse> {
        // This method should be called with the refresh token from the store
        // The actual implementation will be handled by the API client interceptor
        throw new Error('This method should not be called directly. Use API client instead.')
    }

    /**
     * Get current admin profile - gọi thẳng tới backend API
     */
    async getProfile(): Promise<AdminProfile> {
        return apiClient.get('/auth/me')
    }

    /**
     * Admin logout - gọi thẳng tới backend API
     */
    async logout(): Promise<LogoutResponse> {
        try {
            return await apiClient.post('/auth/logout')
        } catch (error) {
            // Even if logout fails on server, we should still clear local state
            console.error('Logout API call failed:', error)
            return { message: 'Logged out locally' }
        }
    }
}

export const authService = new AuthService()
