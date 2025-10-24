/**
 * Utility to normalize API responses from backend
 * Backend returns: { message, statusCode, data: { ... } }
 * We want to extract just the data part
 */

export function normalizeApiResponse<T>(response: any): T {
    // If response has nested data structure
    if (response && typeof response === 'object' && 'data' in response) {
        return response.data as T
    }

    // Return as-is if no nested structure
    return response as T
}

export function normalizeApiError(error: any): string {
    if (error && typeof error === 'object') {
        return error.message || error.error || 'An error occurred'
    }

    return String(error)
}
