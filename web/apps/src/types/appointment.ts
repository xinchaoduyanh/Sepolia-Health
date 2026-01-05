// Types for Appointment API
export interface PatientProfile {
    id: number
    firstName: string
    lastName: string
    phone: string
    dateOfBirth?: string
    gender?: string
    avatar?: string
    address?: string
    idCardNumber?: string
    occupation?: string
    nationality?: string
}

export interface Doctor {
    id: number
    firstName: string
    lastName: string
    avatar?: string
    experience?: string
    contactInfo?: string
    specialties?: {
        specialty: {
            name: string
        }
    }[]
}

export interface Service {
    id: number
    name: string
    price: number
    duration: number
}

export interface Clinic {
    id: number
    name: string
}

export interface Billing {
    id: number
    amount: number
    status: string
    paymentMethod: string | null
    notes: string | null
    createdAt: string
}

export interface AppointmentDetail {
    id: number
    startTime: string
    endTime: string
    status: string
    notes?: string | null
    type: 'ONLINE' | 'OFFLINE'
    joinUrl?: string | null
    hostUrl?: string | null
    patientProfile?: PatientProfile
    doctor?: Doctor
    service?: Service
    clinic?: Clinic | null
    doctorServiceId?: number
    billing?: Billing | null
    createdAt: string
}

export type AppointmentDetailResponse = AppointmentDetail
