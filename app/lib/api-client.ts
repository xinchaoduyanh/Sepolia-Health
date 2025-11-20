// @ts-ignore - axios will be installed
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, ApiResponse, ApiError } from './config';

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    this.setupInterceptors();
    // Load token synchronously to avoid race conditions
    this.loadToken();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config: any) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error: any) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error: any) => {
        const originalRequest = error.config;

        // Check for DEACTIVE status (403 with specific message)
        if (error.response?.status === 403) {
          const errorMessage = error.response?.data?.message || '';
          if (errorMessage.includes('Tài khoản bạn bị khóa')) {
            // Store DEACTIVE flag in AsyncStorage
            await AsyncStorage.setItem('user_deactive', 'true');
          }
        }

        // Handle 401 Unauthorized
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await this.refreshToken();
            return this.client(originalRequest);
          } catch (refreshError: any) {
            // Check if refresh token failed due to DEACTIVE
            if (refreshError.response?.status === 403) {
              const errorMessage = refreshError.response?.data?.message || '';
              if (errorMessage.includes('Tài khoản bạn bị khóa')) {
                await AsyncStorage.setItem('user_deactive', 'true');
              }
            }
            await this.logout();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  private async loadToken() {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        this.token = token;
      }
    } catch (err) {
      console.error('Error loading token:', err);
    }
  }

  public async setToken(token: string) {
    this.token = token;
    await AsyncStorage.setItem('auth_token', token);
  }

  public async clearToken() {
    this.token = null;
    await AsyncStorage.removeItem('auth_token');
  }

  // IMPROVEMENT: Thêm method để kiểm tra token một cách đồng bộ
  public hasToken(): boolean {
    return !!this.token;
  }

  // Method để kiểm tra token từ AsyncStorage (async)
  public async hasTokenAsync(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      return !!token;
    } catch {
      return false;
    }
  }

  private async refreshToken() {
    try {
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await this.client.post('/auth/refresh-token', {
        refreshToken,
      });

      const { accessToken, refreshToken: newRefreshToken } = response.data.data;
      await this.setToken(accessToken);
      await AsyncStorage.setItem('refresh_token', newRefreshToken);
    } catch (err) {
      console.error('Refresh token failed:', err);
      throw new Error('Failed to refresh token');
    }
  }

  private async logout() {
    await this.clearToken();
    // You can add navigation logic here if needed
    // navigation.navigate('Login');
  }

  private handleError(error: any): ApiError {
    if (error.response) {
      // Server responded with error status
      const responseData = error.response.data;

      // Handle validation errors (message is array)
      let message = 'An error occurred';
      if (Array.isArray(responseData?.message)) {
        // Join validation error messages
        message = responseData.message.map((err: any) => err.message).join('. ');
      } else if (typeof responseData?.message === 'string') {
        message = responseData.message;
      }

      return {
        message,
        status: error.response.status,
        code: responseData?.statusCode?.toString(),
      };
    } else if (error.request) {
      // Request was made but no response received
      return {
        message: 'Network error. Please check your connection.',
      };
    } else {
      // Something else happened
      return {
        message: error.message || 'An unexpected error occurred',
      };
    }
  }

  // Generic request methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.get(url, config);
    return response.data;
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.client.post(url, data, config);
    return response.data;
  }

  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.client.put(url, data, config);
    return response.data;
  }

  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.client.patch(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.delete(url, config);
    return response.data;
  }

  // File upload method
  async uploadFile<T = any>(
    url: string,
    file: FormData,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.client.post(url, file, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers,
      },
    });
    return response.data;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;
