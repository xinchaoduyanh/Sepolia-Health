import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { config } from './config'
import { RefreshTokenResponse } from './api-services/auth.service'

/**
 * Enhanced API client with interceptors for error handling
 * Now calls directly to backend API with token-based authentication
 */
export class ApiClient {
    private client: AxiosInstance
    private isRefreshing = false
    private authStore: any = null

    constructor() {
        this.client = axios.create({
            baseURL: config.apiUrl,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
            },
        })

        this.setupInterceptors()
    }

    // Set auth store reference for token management
    setAuthStore(authStore: any) {
        this.authStore = authStore
    }

    private getTokenFromStorage(type: 'access' | 'refresh' = 'access'): string | null {
        try {
            const authStorage = localStorage.getItem('auth-storage')
            if (authStorage) {
                const parsed = JSON.parse(authStorage)
                return type === 'access' ? parsed.state?.accessToken || null : parsed.state?.refreshToken || null
            }
        } catch (error) {
            console.error(`Error reading ${type} token from localStorage:`, error)
        }
        return null
    }

    private setupInterceptors() {
        // Request interceptor to add auth token
        this.client.interceptors.request.use(
            config => {
                const token = this.getTokenFromStorage()

                if (token) {
                    config.headers.Authorization = `Bearer ${token}`
                }
                return config
            },
            error => {
                return Promise.reject(error)
            },
        )

        // Response interceptor for error handling and auto token refresh
        this.client.interceptors.response.use(
            (response: AxiosResponse) => response,
            async error => {
                // Handle 401 - try to refresh and retry
                if (error.response?.status === 401 && error.config && !this.isRefreshing) {
                    this.isRefreshing = true

                    try {
                        await this.performRefresh()
                        const newToken = this.getTokenFromStorage()

                        if (newToken && error.config) {
                            error.config.headers.Authorization = `Bearer ${newToken}`
                            this.isRefreshing = false
                            return this.client(error.config) // Retry request
                        }
                    } catch (err) {
                        console.error('❌ Token refresh failed:', err)
                        this.isRefreshing = false
                        this.authStore?.logout()

                        if (typeof window !== 'undefined') {
                            window.location.href = '/login'
                        }

                        return Promise.reject(err)
                    }
                }

                return Promise.reject(error)
            },
        )
    }

    private updateTokensInStorage(accessToken: string, refreshToken: string): void {
        try {
            const authStorage = localStorage.getItem('auth-storage')
            if (authStorage) {
                const parsed = JSON.parse(authStorage)
                parsed.state.accessToken = accessToken
                parsed.state.refreshToken = refreshToken
                localStorage.setItem('auth-storage', JSON.stringify(parsed))
            }
        } catch (error) {
            console.error('Error updating tokens in localStorage:', error)
        }
    }

    private async performRefresh(): Promise<void> {
        const refreshToken = this.getTokenFromStorage('refresh')

        if (!refreshToken) {
            throw new Error('No refresh token available')
        }

        try {
            const response = await this.client.post<any>('/auth/refresh-token', { refreshToken })

            const data = this.unwrapResponse<RefreshTokenResponse>(response.data)

            // Update tokens in localStorage
            this.updateTokensInStorage(data.accessToken, data.refreshToken)

            // Also update auth store if available
            if (this.authStore) {
                this.authStore.setTokens({
                    accessToken: data.accessToken,
                    refreshToken: data.refreshToken,
                })
            }
        } catch (error) {
            console.error('Refresh token failed:', error)
            throw error
        }
    }

    // Helper to unwrap BE response structure { data, message, statusCode }
    private unwrapResponse<T>(responseData: any): T {
        // If response has the wrapped structure { data, message, statusCode }, unwrap it
        if (responseData && typeof responseData === 'object' && 'data' in responseData && 'message' in responseData) {
            return responseData.data as T
        }
        return responseData as T
    }

    // Generic HTTP methods
    async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.client.get(url, config)
        return this.unwrapResponse<T>(response.data)
    }

    async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.client.post(url, data, config)
        return this.unwrapResponse<T>(response.data)
    }

    async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.client.put(url, data, config)
        return this.unwrapResponse<T>(response.data)
    }

    async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.client.patch(url, data, config)
        return this.unwrapResponse<T>(response.data)
    }

    async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.client.delete(url, config)
        return this.unwrapResponse<T>(response.data)
    }

    // Get the underlying axios instance for custom requests
    getInstance(): AxiosInstance {
        return this.client
    }
}

// Create singleton instance
export const apiClient = new ApiClient()

// Function to initialize API client with auth store
export const initializeApiClient = (authStore: any) => {
    apiClient.setAuthStore(authStore)
}
