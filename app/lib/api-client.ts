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
        const isDeactiveError =
          error.response?.status === 403 &&
          (error.response?.data?.message?.includes('Tài khoản này hiện đang bị khóa') ||
            error.response?.data?.message?.includes('Tài khoản bạn bị khóa'));

        if (isDeactiveError) {
          // Store DEACTIVE flag in AsyncStorage
          await AsyncStorage.setItem('user_deactive', 'true');
          // Clear token and refresh token immediately to prevent any further API calls
          await this.clearToken();
          await AsyncStorage.removeItem('refresh_token');
          // Don't retry or call refresh token - return error directly
          return Promise.reject(this.handleError(error));
        }

        // Handle 401 Unauthorized - BUT don't retry for login/register/auth endpoints
        // Also don't retry if we already detected deactive
        const isAuthEndpoint =
          originalRequest.url?.includes('/auth/login') ||
          originalRequest.url?.includes('/auth/register') ||
          originalRequest.url?.includes('/auth/refresh-token');

        // ALWAYS check if user is already marked as deactive BEFORE attempting refresh
        const deactiveFlag = await AsyncStorage.getItem('user_deactive');
        const isUserDeactive = deactiveFlag === 'true';

        // If user is deactive, don't attempt refresh token at all
        if (isUserDeactive) {
          // Clear tokens if not already cleared
          await this.clearToken();
          // Return error directly without attempting refresh
          return Promise.reject(this.handleError(error));
        }

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
          originalRequest._retry = true;

          try {
            // Double check deactive flag before attempting refresh
            const currentDeactiveFlag = await AsyncStorage.getItem('user_deactive');
            if (currentDeactiveFlag === 'true') {
              await this.clearToken();
              return Promise.reject(this.handleError(error));
            }

            const refreshSuccess = await this.refreshToken();
            // Only retry if refresh token succeeded (response is 200)
            if (refreshSuccess) {
              // Triple check deactive flag before retrying request
              const finalDeactiveFlag = await AsyncStorage.getItem('user_deactive');
              if (finalDeactiveFlag === 'true') {
                await this.clearToken();
                return Promise.reject(this.handleError(error));
              }
              return this.client(originalRequest);
            }
          } catch (refreshError: any) {
            // Check if refresh token failed due to DEACTIVE
            const isRefreshDeactiveError =
              refreshError.response?.status === 403 &&
              (refreshError.response?.data?.message?.includes('Tài khoản này hiện đang bị khóa') ||
                refreshError.response?.data?.message?.includes('Tài khoản bạn bị khóa'));

            if (isRefreshDeactiveError || refreshError.message === 'User account is deactive') {
              await AsyncStorage.setItem('user_deactive', 'true');
              await this.clearToken();
            }
            await this.logout();
            return Promise.reject(refreshError);
          }
        }

        // For auth endpoints with 401, return error directly without retry
        // This ensures login form can catch and display the error message
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
    // Also clear refresh token to prevent any refresh attempts
    await AsyncStorage.removeItem('refresh_token');
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

  private async refreshToken(): Promise<boolean> {
    try {
      // Check if user is deactive BEFORE attempting refresh
      const deactiveFlag = await AsyncStorage.getItem('user_deactive');
      if (deactiveFlag === 'true') {
        // User is deactive, don't attempt refresh
        throw new Error('User account is deactive');
      }

      const refreshToken = await AsyncStorage.getItem('refresh_token');
      if (!refreshToken) {
        // Don't throw error if user is deactive to avoid confusing messages
        const isDeactive = await AsyncStorage.getItem('user_deactive');
        if (isDeactive === 'true') {
          throw new Error('User account is deactive');
        }
        throw new Error('No refresh token available');
      }

      const response = await this.client.post('/auth/refresh-token', {
        refreshToken,
      });

      // Only proceed if response status is 200 (success)
      if (response.status === 200 && response.data) {
        const { accessToken, refreshToken: newRefreshToken } = response.data.data || response.data;

        if (accessToken) {
          await this.setToken(accessToken);
          if (newRefreshToken) {
            await AsyncStorage.setItem('refresh_token', newRefreshToken);
          }
          return true;
        }
      }

      // If not 200 or missing data, refresh failed
      throw new Error('Refresh token response invalid');
    } catch (err: any) {
      console.error('Refresh token failed:', err);

      // Check if error is due to deactive
      const isDeactiveError =
        err.response?.status === 403 &&
        (err.response?.data?.message?.includes('Tài khoản này hiện đang bị khóa') ||
          err.response?.data?.message?.includes('Tài khoản bạn bị khóa'));

      if (isDeactiveError || err.message === 'User account is deactive') {
        await AsyncStorage.setItem('user_deactive', 'true');
        await this.clearToken();
        await AsyncStorage.removeItem('refresh_token');
      }

      // If error has response data, preserve it
      if (err.response?.data) {
        throw err;
      }

      // Otherwise throw a generic error
      const error = new Error(err.message || 'Failed to refresh token');
      (error as any).response = err.response;
      throw error;
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
