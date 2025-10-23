import { apiClient } from '../api-client'

// Types for users API
export interface User {
    id: number
    email: string
    phone: string | null
    role: 'PATIENT' | 'DOCTOR' | 'RECEPTIONIST' | 'ADMIN'
    status: 'UNVERIFIED' | 'ACTIVE' | 'DEACTIVE'
    createdAt: string
    updatedAt: string
    doctorProfile?: DoctorProfile
    receptionistProfile?: ReceptionistProfile
    patientProfiles?: PatientProfile[]
}

export interface DoctorProfile {
    id: number
    firstName: string
    lastName: string
    dateOfBirth?: string
    gender?: 'MALE' | 'FEMALE' | 'OTHER'
    avatar?: string
    specialty: string
    experience?: string
    contactInfo?: string
    userId: number
    clinicId?: number
    createdAt: string
    updatedAt: string
}

export interface ReceptionistProfile {
    id: number
    firstName: string
    lastName: string
    dateOfBirth?: string
    gender?: 'MALE' | 'FEMALE' | 'OTHER'
    avatar?: string
    department?: string
    userId: number
    createdAt: string
    updatedAt: string
}

export interface PatientProfile {
    id: number
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
    managerId: number
    createdAt: string
    updatedAt: string
}

export interface UsersListParams {
    page?: number
    limit?: number
    role?: string
    status?: string
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
}

export interface UsersListResponse {
    users: User[]
    total: number
    page: number
    limit: number
    totalPages: number
}

export interface CreateUserRequest {
    email: string
    password: string
    phone?: string
    role: string
    // Profile data based on role
    profile?: any
}

export interface UpdateUserRequest {
    email?: string
    phone?: string
    status?: string
    // Profile data based on role
    profile?: any
}

export class UsersService {
    /**
     * Get users list with pagination and filters
     */
    async getUsers(params: UsersListParams = {}): Promise<UsersListResponse> {
        return apiClient.get<UsersListResponse>('/admin/users', { params })
    }

    /**
     * Get user by ID
     */
    async getUser(id: number): Promise<User> {
        return apiClient.get<User>(`/admin/users/${id}`)
    }

    /**
     * Create new user
     */
    async createUser(userData: CreateUserRequest): Promise<User> {
        return apiClient.post<User>('/admin/users', userData)
    }

    /**
     * Update user
     */
    async updateUser(id: number, userData: UpdateUserRequest): Promise<User> {
        return apiClient.put<User>(`/admin/users/${id}`, userData)
    }

    /**
     * Delete user
     */
    async deleteUser(id: number): Promise<void> {
        return apiClient.delete<void>(`/admin/users/${id}`)
    }

    /**
     * Update user status
     */
    async updateUserStatus(id: number, status: string): Promise<User> {
        return apiClient.patch<User>(`/admin/users/${id}/status`, { status })
    }

    /**
     * Get doctors list
     */
    async getDoctors(params: UsersListParams = {}): Promise<UsersListResponse> {
        return apiClient.get<UsersListResponse>('/admin/doctors', { params })
    }

    /**
     * Get doctor by ID
     */
    async getDoctor(id: number): Promise<User> {
        return apiClient.get<User>(`/admin/doctors/${id}`)
    }

    /**
     * Get patients list
     */
    async getPatients(params: UsersListParams = {}): Promise<UsersListResponse> {
        return apiClient.get<UsersListResponse>('/admin/patients', { params })
    }

    /**
     * Get patient by ID
     */
    async getPatient(id: number): Promise<User> {
        return apiClient.get<User>(`/admin/patients/${id}`)
    }
}

export const usersService = new UsersService()
