import { apiClient } from '../api-client';
import type { PatientProfile } from '@/types/auth';

export interface UploadAvatarResponse {
  avatarUrl: string;
}

export const userApi = {
  // Get all patient profiles
  getPatientProfiles: async (): Promise<{ profiles: PatientProfile[] }> => {
    const response = await apiClient.get('/user/patient-profiles');
    return response.data;
  },

  // Create patient profile
  createPatientProfile: async (
    data: Partial<PatientProfile>
  ): Promise<{ profile: PatientProfile }> => {
    const response = await apiClient.post('/user/patient-profiles', data);
    return response.data;
  },

  // Update patient profile
  updatePatientProfile: async (
    profileId: number,
    data: Partial<PatientProfile>
  ): Promise<{ profile: PatientProfile }> => {
    const response = await apiClient.put(`/user/patient-profiles/${profileId}`, data);
    return response.data;
  },

  // Upload avatar for patient profile
  uploadPatientProfileAvatar: async (
    profileId: number,
    file: FormData
  ): Promise<UploadAvatarResponse> => {
    const response = await apiClient.post(
      `/user/patient-profiles/${profileId}/upload-avatar`,
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
    const response = await apiClient.post('/user/upload-avatar', file, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
