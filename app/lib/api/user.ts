import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { API_ENDPOINTS } from '@/constants/api';
import type { PatientProfile } from '@/types/auth';
import { UploadAvatarResponse } from '@/types/user';
import { authKeys } from './auth';

// Query Keys Factory
export const userKeys = {
  all: ['user'] as const,
  patientProfiles: () => [...userKeys.all, 'patientProfiles'] as const,
} as const;

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

// React Query Hooks
export const useUploadPatientProfileAvatar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ profileId, file }: { profileId: number; file: FormData }) =>
      userApi.uploadPatientProfileAvatar(profileId, file),
    onSuccess: async (data, variables) => {
      // Optimistically update the profile in cache
      queryClient.setQueryData(authKeys.profile(), (oldData: any) => {
        if (!oldData) return oldData;

        const updatedProfiles = oldData.patientProfiles?.map((profile: PatientProfile) =>
          profile.id === variables.profileId ? { ...profile, avatar: data.avatarUrl } : profile
        );

        return {
          ...oldData,
          patientProfiles: updatedProfiles,
        };
      });

      // Invalidate and refetch profile immediately to ensure consistency
      await queryClient.invalidateQueries({ queryKey: authKeys.profile() });
      await queryClient.refetchQueries({ queryKey: authKeys.profile() });
    },
  });
};

export const useUploadUserAvatar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: FormData) => userApi.uploadUserAvatar(file),
    onSuccess: async (data) => {
      // Optimistically update the profile in cache
      queryClient.setQueryData(authKeys.profile(), (oldData: any) => {
        if (!oldData) return oldData;

        // Update primary patient profile avatar
        const updatedProfiles = oldData.patientProfiles?.map((profile: PatientProfile) =>
          profile.relationship === 'SELF' ? { ...profile, avatar: data.avatarUrl } : profile
        );

        return {
          ...oldData,
          patientProfiles: updatedProfiles,
        };
      });

      // Invalidate and refetch profile immediately to ensure consistency
      await queryClient.invalidateQueries({ queryKey: authKeys.profile() });
      await queryClient.refetchQueries({ queryKey: authKeys.profile() });
    },
  });
};

export const useUpdatePatientProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ profileId, data }: { profileId: number; data: Partial<PatientProfile> }) =>
      userApi.updatePatientProfile(profileId, data),
    onSuccess: async (data, variables) => {
      // Optimistically update the profile in cache
      queryClient.setQueryData(authKeys.profile(), (oldData: any) => {
        if (!oldData) return oldData;

        const updatedProfiles = oldData.patientProfiles?.map((profile: PatientProfile) =>
          profile.id === variables.profileId ? { ...profile, ...data.profile } : profile
        );

        return {
          ...oldData,
          patientProfiles: updatedProfiles,
        };
      });

      // Invalidate and refetch profile immediately to ensure consistency
      await queryClient.invalidateQueries({ queryKey: authKeys.profile() });
      await queryClient.refetchQueries({ queryKey: authKeys.profile() });
    },
  });
};
