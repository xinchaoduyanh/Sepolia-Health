import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { config } from './config'

/**
 * Enhanced API client with interceptors for error handling
 * Now calls directly to backend API with token-based authentication
 */
export class ApiClient {
    private client: AxiosInstance
    private isRefreshing = false
    private refreshPromise: Promise<any> | null = null
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
        console.log('🔧 API Client initialized with auth store:', {
            hasAuthStore: !!authStore,
            hasAccessToken: !!authStore?.accessToken,
            hasRefreshToken: !!authStore?.refreshToken,
            isAuthenticated: authStore?.isAuthenticated,
            user: authStore?.user,
        })
    }

    private setupInterceptors() {
        // Request interceptor to add auth token
        this.client.interceptors.request.use(
            config => {
                // Get token from localStorage directly - simple and reliable!
                let token = null
                try {
                    const authStorage = localStorage.getItem('auth-storage')
                    if (authStorage) {
                        const parsed = JSON.parse(authStorage)
                        token = parsed.state?.accessToken
                    }
                } catch (error) {
                    console.error('Error reading token from localStorage:', error)
                }

                if (token) {
                    config.headers.Authorization = `Bearer ${token}`
                    console.log('🔑 Adding token to request (from localStorage):', {
                        url: config.url,
                        method: config.method,
                        hasToken: !!token,
                        tokenPreview: token?.substring(0, 20) + '...',
                    })
                } else {
                    console.log('❌ No token found in localStorage for request:', {
                        url: config.url,
                        method: config.method,
                    })
                }
                return config
            },
            error => {
                return Promise.reject(error)
            },
        )

        // Response interceptor for error handling
        this.client.interceptors.response.use(
            (response: AxiosResponse) => {
                console.log('✅ API Response:', {
                    url: response.config.url,
                    method: response.config.method,
                    status: response.status,
                    statusText: response.statusText,
                })
                return response
            },
            async error => {
                console.log('❌ API Error:', {
                    url: error.config?.url,
                    method: error.config?.method,
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    message: error.message,
                    data: error.response?.data,
                })

                // Just log 401 errors, don't handle them automatically
                if (error.response?.status === 401) {
                    console.log('🔒 401 Unauthorized - Token may be invalid or expired')
                    console.log('🔍 Current auth store state:', {
                        hasAuthStore: !!this.authStore,
                        hasAccessToken: !!this.authStore?.accessToken,
                        hasRefreshToken: !!this.authStore?.refreshToken,
                        isAuthenticated: this.authStore?.isAuthenticated,
                    })
                }

                return Promise.reject(error)
            },
        )
    }

    private async performRefresh(): Promise<void> {
        // Get refresh token from localStorage directly
        let refreshToken = null
        try {
            const authStorage = localStorage.getItem('auth-storage')
            if (authStorage) {
                const parsed = JSON.parse(authStorage)
                refreshToken = parsed.state?.refreshToken
            }
        } catch (error) {
            console.error('Error reading refresh token from localStorage:', error)
        }

        if (!refreshToken) {
            throw new Error('No refresh token available')
        }

        try {
            const response = await fetch(`${config.authApiUrl}/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${refreshToken}`,
                },
            })

            if (!response.ok) {
                throw new Error('Token refresh failed')
            }

            const data = await response.json()

            // Update tokens in localStorage directly
            try {
                const authStorage = localStorage.getItem('auth-storage')
                if (authStorage) {
                    const parsed = JSON.parse(authStorage)
                    if (data.accessToken) {
                        parsed.state.accessToken = data.accessToken
                    }
                    if (data.refreshToken) {
                        parsed.state.refreshToken = data.refreshToken
                    }
                    localStorage.setItem('auth-storage', JSON.stringify(parsed))
                    console.log('✅ Tokens updated in localStorage')
                }
            } catch (error) {
                console.error('Error updating tokens in localStorage:', error)
            }

            // Also update auth store if available
            if (this.authStore) {
                if (data.accessToken) {
                    this.authStore.setAccessToken(data.accessToken)
                }
                if (data.accessToken && data.refreshToken) {
                    this.authStore.setTokens({
                        accessToken: data.accessToken,
                        refreshToken: data.refreshToken,
                    })
                }
            }
        } catch (error) {
            console.error('Refresh token failed:', error)
            throw error
        }
    }

    // Generic HTTP methods
    async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.client.get(url, config)
        return response.data
    }

    async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.client.post(url, data, config)
        return response.data
    }

    async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.client.put(url, data, config)
        return response.data
    }

    async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.client.patch(url, data, config)
        return response.data
    }

    async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.client.delete(url, config)
        return response.data
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
