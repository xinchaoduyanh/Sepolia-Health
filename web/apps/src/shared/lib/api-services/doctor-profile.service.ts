import { apiClient } from '../api-client'

// Types for Doctor Profile API
export interface DoctorProfileResponse {
    id: number
    email: string
    firstName: string
    lastName: string
    phone: string | null
    address: string | null
    dateOfBirth: string | null
    gender: 'MALE' | 'FEMALE' | 'OTHER' | null
    avatar: string | null
    role: string
    status: string
    createdAt: string
    updatedAt: string
    patientProfiles?: any[]
}

export interface UpdateDoctorProfileRequest {
    firstName?: string
    lastName?: string
    phone?: string
    address?: string
    dateOfBirth?: string
    gender?: 'MALE' | 'FEMALE' | 'OTHER'
    avatar?: string
}

export interface UpdateDoctorProfileResponse {
    user: DoctorProfileResponse
}

export class DoctorProfileService {
    /**
     * Get current doctor profile
     * GET /patient/user/profile
     */
    async getProfile(): Promise<DoctorProfileResponse> {
        return apiClient.get<DoctorProfileResponse>('/patient/user/profile')
    }

    /**
     * Update doctor profile
     * PUT /patient/user/profile
     */
    async updateProfile(data: UpdateDoctorProfileRequest): Promise<UpdateDoctorProfileResponse> {
        return apiClient.put<UpdateDoctorProfileResponse>('/patient/user/profile', data)
    }

    /**
     * Upload avatar
     * POST /patient/user/upload-avatar
     */
    async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
        const formData = new FormData()
        formData.append('avatar', file)
        return apiClient.post<{ avatarUrl: string }>('/patient/user/upload-avatar', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
    }
}

export const doctorProfileService = new DoctorProfileService()
