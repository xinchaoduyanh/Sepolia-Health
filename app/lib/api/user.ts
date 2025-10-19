import { apiClient } from '../api-client';
import { API_ENDPOINTS } from '@/constants/api';
import type { PatientProfile } from '@/types/auth';

export interface UploadAvatarResponse {
  avatarUrl: string;
}

export const userApi = {
  // Get all patient profiles
  getPatientProfiles: async (): Promise<{ profiles: PatientProfile[] }> => {
    const response = await apiClient.get(API_ENDPOINTS.USERS.PATIENT_PROFILES);
    return response.data;
  },

  // Create patient profile
  createPatientProfile: async (
    data: Partial<PatientProfile>
  ): Promise<{ profile: PatientProfile }> => {
    const response = await apiClient.post(API_ENDPOINTS.USERS.PATIENT_PROFILES, data);
    return response.data;
  },

  // Update patient profile
  updatePatientProfile: async (
    profileId: number,
    data: Partial<PatientProfile>
  ): Promise<{ profile: PatientProfile }> => {
    const response = await apiClient.put(
      `${API_ENDPOINTS.USERS.PATIENT_PROFILES}/${profileId}`,
      data
    );
    return response.data;
  },

  // Upload avatar for patient profile
  uploadPatientProfileAvatar: async (
    profileId: number,
    file: FormData
  ): Promise<UploadAvatarResponse> => {
    const response = await apiClient.post(
      `${API_ENDPOINTS.USERS.PATIENT_PROFILES}/${profileId}/upload-avatar`,
      file,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  // Upload avatar for user (primary profile)
  uploadUserAvatar: async (file: FormData): Promise<UploadAvatarResponse> => {
    const response = await apiClient.post(API_ENDPOINTS.USERS.UPLOAD_AVATAR, file, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
