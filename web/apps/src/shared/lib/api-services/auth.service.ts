import { apiClient } from '../api-client'
import { Role } from '@/types/role'

// Types for auth API - matching BE DTOs
export interface LoginRequest {
    email: string
    password: string
}

export interface LoginResponse {
    accessToken: string
    refreshToken: string
}

export interface UserProfile {
    id: number
    email: string
    phone: string | null
    role: Role
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

export interface ForgotPasswordRequest {
    email: string
    otp: string
    newPassword: string
}

export class AuthService {
    /**
     * Login - gọi thẳng tới backend API
     */
    async login(credentials: LoginRequest): Promise<LoginResponse> {
        return await apiClient.post('/auth/login', credentials)
    }

    /**
     * Get current user profile - gọi thẳng tới backend API
     */
    async getProfile(): Promise<UserProfile> {
        return await apiClient.get('/auth/me')
    }

    /**
     * Logout - gọi thẳng tới backend API
     */
    async logout(): Promise<LogoutResponse> {
        return await apiClient.post('/auth/logout')
    }

    async resetPassword(data: ForgotPasswordRequest): Promise<any> {
        return await apiClient.post('/auth/reset-password', data)
    }
}

export const authService = new AuthService()
