'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { doctorProfileService, type UpdateDoctorProfileRequest } from '../lib/api-services/doctor-profile.service'
import { queryKeys } from '../lib/query-keys'
import { toast } from '@workspace/ui/components/Sonner'

/**
 * Hook to get current doctor profile
 */
export function useDoctorProfile() {
    return useQuery({
        queryKey: queryKeys.doctor.profile(),
        queryFn: () => doctorProfileService.getProfile(),
        staleTime: 1000 * 60 * 5, // 5 minutes
    })
}

/**
 * Hook to update doctor profile
 */
export function useUpdateDoctorProfile() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: UpdateDoctorProfileRequest) => doctorProfileService.updateProfile(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.doctor.profile() })
            toast.success({
                title: 'Thành công',
                description: 'Cập nhật hồ sơ thành công',
            })
        },
        onError: (error: any) => {
            toast.error({
                title: 'Lỗi',
                description: error?.message || 'Cập nhật hồ sơ thất bại',
            })
        },
    })
}

/**
 * Hook to upload avatar
 */
export function useUploadAvatar() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (file: File) => doctorProfileService.uploadAvatar(file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.doctor.profile() })
            toast.success({
                title: 'Thành công',
                description: 'Upload ảnh đại diện thành công',
            })
        },
        onError: (error: any) => {
            toast.error({
                title: 'Lỗi',
                description: error?.message || 'Upload ảnh đại diện thất bại',
            })
        },
    })
}
