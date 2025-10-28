import { apiClient } from '../api-client'

export interface UploadResponse {
    avatarUrl: string
}

interface UploadApiResponse {
    success: boolean
    url?: string
    error?: string
}

export class UploadService {
    /**
     * Upload avatar for admin (temporary upload for new patient)
     * This uploads to S3 using admin endpoint and returns URL
     */
    async uploadAvatar(file: File): Promise<UploadResponse> {
        const formData = new FormData()
        formData.append('avatar', file)

        try {
            const responseData = await apiClient.post<UploadApiResponse>('/admin/upload/avatar', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            })

            // Handle admin upload response structure (already unwrapped by apiClient)
            if (responseData?.success && responseData?.url) {
                return {
                    avatarUrl: responseData.url,
                }
            } else {
                throw new Error('Upload failed')
            }
        } catch (error: any) {
            console.error('Admin avatar upload error:', error)
            // Handle both wrapped and unwrapped error responses
            const errorMessage =
                error?.response?.data?.message || error?.response?.data?.data?.message || 'Lỗi khi upload ảnh'
            throw new Error(errorMessage)
        }
    }

    /**
     * Upload avatar with custom endpoint (more flexible)
     */
    async uploadAvatarCustom(file: File, endpoint: string = '/admin/upload/avatar'): Promise<string> {
        const formData = new FormData()
        formData.append('avatar', file)

        try {
            const responseData = await apiClient.post<UploadApiResponse>(endpoint, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            })

            // Handle admin upload response structure (already unwrapped by apiClient)
            if (responseData?.success && responseData?.url) {
                return responseData.url
            } else {
                throw new Error('Invalid response structure')
            }
        } catch (error: any) {
            console.error('Upload error:', error)
            // Handle both wrapped and unwrapped error responses
            const errorMessage =
                error?.response?.data?.message || error?.response?.data?.data?.message || 'Lỗi khi upload ảnh'
            throw new Error(errorMessage)
        }
    }
}

export const uploadService = new UploadService()
