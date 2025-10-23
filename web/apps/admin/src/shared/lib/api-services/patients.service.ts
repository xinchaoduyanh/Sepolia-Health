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
    data: {
        patients: Patient[]
        total: number
        page: number
        limit: number
        totalPages: number
    }
}

export interface PatientDetailResponse {
    data: Patient
}

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

export interface CreatePatientResponse {
    data: Patient
}

export class PatientsService {
    /**
     * Get patients list with pagination and filters
     * GET /api/patients
     */
    async getPatients(params: PatientsListParams = {}): Promise<PatientsListResponse> {
        return apiClient.get<PatientsListResponse>('/patients', { params })
    }

    /**
     * Get patient by ID
     * GET /api/patients/{id}
     */
    async getPatient(id: number): Promise<PatientDetailResponse> {
        return apiClient.get<PatientDetailResponse>(`/patients/${id}`)
    }

    /**
     * Create new patient
     * POST /api/patients
     */
    async createPatient(patientData: CreatePatientRequest): Promise<CreatePatientResponse> {
        return apiClient.post<CreatePatientResponse>('/patients', patientData)
    }

    /**
     * Update patient
     * PUT /api/patients/{id}
     */
    async updatePatient(id: number, patientData: UpdatePatientRequest): Promise<PatientDetailResponse> {
        return apiClient.put<PatientDetailResponse>(`/patients/${id}`, patientData)
    }

    /**
     * Delete patient
     * DELETE /api/patients/{id}
     */
    async deletePatient(id: number): Promise<void> {
        return apiClient.delete<void>(`/patients/${id}`)
    }

    /**
     * Update patient status
     * PATCH /api/patients/{id}
     */
    async updatePatientStatus(
        id: number,
        status: 'UNVERIFIED' | 'ACTIVE' | 'DEACTIVE',
    ): Promise<PatientDetailResponse> {
        return apiClient.patch<PatientDetailResponse>(`/patients/${id}`, { status })
    }
}

export const patientsService = new PatientsService()
