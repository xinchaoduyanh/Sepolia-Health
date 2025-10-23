import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

/**
 * Enhanced API client with interceptors for error handling
 * Note: Authentication is now handled by cookies via proxy routes
 */
export class ApiClient {
    private client: AxiosInstance

    constructor(baseURL: string = '/api') {
        this.client = axios.create({
            baseURL,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
            },
            withCredentials: true, // Enable cookies
        })

        this.setupInterceptors()
    }

    private setupInterceptors() {
        // Response interceptor for error handling
        this.client.interceptors.response.use(
            (response: AxiosResponse) => {
                return response
            },
            async error => {
                // Handle 401 errors (unauthorized)
                if (error.response?.status === 401) {
                    if (typeof window !== 'undefined') {
                        // Try to refresh token first
                        try {
                            const refreshResponse = await fetch('/api/auth/refresh', {
                                method: 'POST',
                                credentials: 'include',
                            })

                            if (refreshResponse.ok) {
                                // Token refreshed successfully, retry the original request
                                return this.client.request(error.config)
                            }
                        } catch (refreshError) {
                            console.error('Token refresh failed:', refreshError)
                        }

                        // If refresh fails or this is not a retry, redirect to login
                        window.location.href = '/login'
                    }
                }

                return Promise.reject(error)
            },
        )
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
