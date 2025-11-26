export interface PatientProfile {
    id: number
    firstName: string
    lastName: string
    dateOfBirth: string
    gender: 'MALE' | 'FEMALE'
    phone: string
    relationship: 'SELF' | 'PARENT' | 'CHILD' | 'SPOUSE' | 'OTHER'
    avatar?: string
    idCardNumber?: string
    occupation?: string
    nationality?: string
    address?: string
    createdAt: string
    updatedAt: string
}

export interface FindPatientRequest {
    email: string
}

export interface FindPatientResponse {
    found: boolean
    user?: {
        id: number
        email: string
        phone?: string
        status: string
        role: string
    }
    patientProfiles?: PatientProfile[]
}

export interface CreatePatientAccountRequest {
    email: string
    firstName: string
    lastName: string
    phone: string
    dateOfBirth: string
    gender: 'MALE' | 'FEMALE'
    idCardNumber?: string
    address?: string
    occupation?: string
    nationality?: string
}

export interface CreatePatientAccountResponse {
    user: {
        id: number
        email: string
        phone?: string
        status: string
        role: string
    }
    patientProfile: PatientProfile
    temporaryPassword: string
}

export interface CreateAppointmentForPatientRequest {
    patientProfileId: number
    doctorServiceId: number
    startTime: string
    endTime: string
    notes?: string
}

export interface CreateAppointmentForPatientResponse {
    id: number
    startTime: string
    endTime: string
    status: string
    notes?: string
    patientProfile: {
        id: number
        firstName: string
        lastName: string
        phone: string
    }
    doctor: {
        id: number
        firstName: string
        lastName: string
    }
    service: {
        id: number
        name: string
        price: number
        duration: number
    }
    clinic?: {
        id: number
        name: string
    }
    createdAt: string
}
