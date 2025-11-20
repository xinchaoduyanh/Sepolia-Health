import { ApiError } from '@/constants/api';
import { AxiosError } from 'axios';

/**
 * Extract error message from various error types
 * Handles ApiError, AxiosError, Error, and string errors
 */
export function getErrorMessage(error: unknown): string {
  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  // Handle null/undefined
  if (!error) {
    return 'Đã xảy ra lỗi không xác định';
  }

  // Handle ApiError (from apiClient.handleError)
  if (error && typeof error === 'object' && 'message' in error) {
    const apiError = error as ApiError;
    if (typeof apiError.message === 'string' && apiError.message) {
      return apiError.message;
    }
  }

  // Handle AxiosError
  if (error && typeof error === 'object' && 'isAxiosError' in error) {
    const axiosError = error as AxiosError<any>;

    // Try to get message from response.data.message
    if (axiosError.response?.data) {
      const responseData = axiosError.response.data;

      // Handle array of messages (validation errors)
      if (Array.isArray(responseData.message)) {
        return responseData.message
          .map((err: any) => (typeof err === 'string' ? err : err.message || err))
          .filter(Boolean)
          .join('. ');
      }

      // Handle string message
      if (typeof responseData.message === 'string' && responseData.message) {
        return responseData.message;
      }
    }

    // Fallback to axios error message
    if (axiosError.message) {
      return axiosError.message;
    }
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return error.message || 'Đã xảy ra lỗi không xác định';
  }

  // Handle objects with message property
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as any).message;
    if (typeof message === 'string' && message) {
      return message;
    }
  }

  // Default fallback
  return 'Đã xảy ra lỗi không xác định';
}





