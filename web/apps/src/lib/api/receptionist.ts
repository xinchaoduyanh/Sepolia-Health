import { apiClient } from '@/shared/lib/api-client'
import type {
    FindPatientRequest,
    FindPatientResponse,
    CreatePatientAccountRequest,
    CreatePatientAccountResponse,
    CreateAppointmentForPatientRequest,
    CreateAppointmentForPatientResponse,
} from '@/types/receptionist'

export interface Clinic {
    id: number
    name: string
    address: string
    phone?: string
    email?: string
    description?: string
}

export interface Service {
    id: number
    name: string
    price: number
    duration: number
    description?: string
}

export interface TimeSlot {
    startTime: string
    endTime: string
    displayTime: string
}

export interface DoctorAvailability {
    doctorId: number
    doctorName: string
    serviceName: string
    serviceDuration: number
    date: string
    workingHours: {
        startTime: string
        endTime: string
    }
    availableTimeSlots: TimeSlot[]
}

export const receptionistApi = {
    // Find patient by email
    findPatientByEmail: async (data: FindPatientRequest): Promise<FindPatientResponse> => {
        return await apiClient.post<FindPatientResponse>('/receptionist/appointment/find-patient', data)
    },

    // Create patient account
    createPatientAccount: async (data: CreatePatientAccountRequest): Promise<CreatePatientAccountResponse> => {
        return await apiClient.post<CreatePatientAccountResponse>('/receptionist/appointment/create-patient', data)
    },

    // Create appointment for patient
    createAppointmentForPatient: async (
        data: CreateAppointmentForPatientRequest,
    ): Promise<CreateAppointmentForPatientResponse> => {
        return await apiClient.post<CreateAppointmentForPatientResponse>('/receptionist/appointment/create', data)
    },

    // Get locations (clinics)
    getLocations: async (): Promise<Clinic[]> => {
        return await apiClient.get<Clinic[]>('/receptionist/appointment/locations')
    },

    // Get services
    getServices: async (): Promise<Service[]> => {
        return await apiClient.get<Service[]>('/receptionist/appointment/services')
    },

    // Get doctor availability (time slots)
    getDoctorAvailability: async (doctorServiceId: number, date: string): Promise<DoctorAvailability> => {
        return await apiClient.get<DoctorAvailability>('/receptionist/appointment/doctor-availability', {
            params: { doctorServiceId, date },
        })
    },
}
