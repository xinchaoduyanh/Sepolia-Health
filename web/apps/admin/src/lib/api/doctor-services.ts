import { apiClient } from '@/shared/lib/api-client'

export interface DoctorService {
    id: number
    doctorId: number
    serviceId: number
    doctor: {
        id: number
        firstName: string
        lastName: string
        experience?: string
        contactInfo?: string
        avatar?: string
    }
}

export interface GetDoctorServicesParams {
    serviceId: number
    locationId: number
}

export const doctorServicesApi = {
    // Get doctor services by service and location (for receptionist)
    getDoctorServices: async (params: GetDoctorServicesParams): Promise<DoctorService[]> => {
        return await apiClient.get<DoctorService[]>('/receptionist/appointment/doctor-services', { params })
    },
}
