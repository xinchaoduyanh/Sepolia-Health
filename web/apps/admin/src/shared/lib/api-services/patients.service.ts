import { apiClient } from '../api-client'

// Types for Patient API based on BE schema
export interface PatientProfile {
    id: number
    firstName: string
    lastName: string
    fullName: string
    dateOfBirth: string
    gender: 'MALE' | 'FEMALE' | 'OTHER'
    phone: string
    relationship: 'SELF' | 'SPOUSE' | 'CHILD' | 'PARENT' | 'SIBLING' | 'RELATIVE' | 'FRIEND' | 'OTHER'
    avatar?: string
    idCardNumber?: string
    occupation?: string
    nationality?: string
    address?: string
    healthDetailsJson?: Record<string, any> | null
    managerId: number
    createdAt: string
    updatedAt: string
}

export interface Patient {
    id: number
    email: string
    phone: string | null
    status: 'UNVERIFIED' | 'ACTIVE' | 'DEACTIVE'
    patientProfiles: PatientProfile[]
    createdAt: string
    updatedAt: string
}

export interface PatientsListParams {
    page?: number
    limit?: number
    status?: 'UNVERIFIED' | 'ACTIVE' | 'DEACTIVE'
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
}

export interface PatientsListResponse {
    patients: Patient[]
    total: number
    page: number
    limit: number
}

export interface PatientDetailResponse extends Patient {}

export interface CreatePatientProfileRequest {
    firstName: string
    lastName: string
    dateOfBirth: string
    gender: 'MALE' | 'FEMALE' | 'OTHER'
    phone: string
    relationship: 'SELF' | 'SPOUSE' | 'CHILD' | 'PARENT' | 'SIBLING' | 'RELATIVE' | 'FRIEND' | 'OTHER'
    avatar?: string
    idCardNumber?: string
    occupation?: string
    nationality?: string
    address?: string
    healthDetailsJson?: Record<string, any>
}

export interface CreatePatientRequest {
    email: string
    password: string
    phone: string
    patientProfiles: CreatePatientProfileRequest[]
}

export interface UpdatePatientProfileRequest {
    id?: number
    firstName?: string
    lastName?: string
    dateOfBirth?: string
    gender?: 'MALE' | 'FEMALE' | 'OTHER'
    phone?: string
    relationship?: 'SELF' | 'SPOUSE' | 'CHILD' | 'PARENT' | 'SIBLING' | 'RELATIVE' | 'FRIEND' | 'OTHER'
    avatar?: string
    idCardNumber?: string
    occupation?: string
    nationality?: string
    address?: string
    healthDetailsJson?: Record<string, any>
}

export interface UpdatePatientRequest {
    email?: string
    password?: string
    phone?: string
    status?: 'UNVERIFIED' | 'ACTIVE' | 'DEACTIVE'
    patientProfiles?: {
        update?: UpdatePatientProfileRequest[]
        create?: CreatePatientProfileRequest[]
        delete?: number[]
    }
}

export interface CreatePatientResponse extends Patient {}

export class PatientsService {
    /**
     * Get patients list with pagination and filters
     * GET /patients
     */
    async getPatients(params: PatientsListParams = {}): Promise<PatientsListResponse> {
        return apiClient.get<PatientsListResponse>('/admin/patients', { params })
    }

    /**
     * Get patient by ID
     * GET /patients/{id}
     */
    async getPatient(id: number): Promise<PatientDetailResponse> {
        return apiClient.get<PatientDetailResponse>(`/admin/patients/${id}`)
    }

    /**
     * Create new patient
     * POST /patients
     */
    async createPatient(patientData: CreatePatientRequest): Promise<CreatePatientResponse> {
        return apiClient.post<CreatePatientResponse>('/admin/patients', patientData)
    }

    /**
     * Update patient
     * PUT /patients/{id}
     */
    async updatePatient(id: number, patientData: UpdatePatientRequest): Promise<PatientDetailResponse> {
        return apiClient.put<PatientDetailResponse>(`/admin/patients/${id}`, patientData)
    }

    /**
     * Delete patient
     * DELETE /patients/{id}
     */
    async deletePatient(id: number): Promise<void> {
        return apiClient.delete<void>(`/admin/patients/${id}`)
    }

    /**
     * Update patient status
     * PATCH /patients/{id}
     */
    async updatePatientStatus(
        id: number,
        status: 'UNVERIFIED' | 'ACTIVE' | 'DEACTIVE',
    ): Promise<PatientDetailResponse> {
        return apiClient.patch<PatientDetailResponse>(`/admin/patients/${id}`, { status })
    }
}

export const patientsService = new PatientsService()
