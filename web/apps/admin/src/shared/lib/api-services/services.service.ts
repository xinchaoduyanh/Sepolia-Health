import { apiClient } from '../api-client'

// Types for Service API based on BE schema
export interface Service {
    id: number
    name: string
    price: number
    duration: number
    description?: string
    createdAt: string
    updatedAt: string
}

export interface ServicesListParams {
    page?: number
    limit?: number
    search?: string
}

export interface ServicesListResponse {
    services: Service[]
    total: number
    page: number
    limit: number
}

export type ServiceDetailResponse = Service

export interface CreateServiceRequest {
    name: string
    price: number
    duration: number
    description?: string
}

export interface UpdateServiceRequest {
    name?: string
    price?: number
    duration?: number
    description?: string
}

export type CreateServiceResponse = Service

export class ServicesService {
    /**
     * Get services list with pagination and filters
     * GET /admin/services
     */
    async getServices(params: ServicesListParams = {}): Promise<ServicesListResponse> {
        return apiClient.get<ServicesListResponse>('/admin/services', { params })
    }

    /**
     * Get service by ID
     * GET /admin/services/{id}
     */
    async getService(id: number): Promise<ServiceDetailResponse> {
        return apiClient.get<ServiceDetailResponse>(`/admin/services/${id}`)
    }

    /**
     * Create new service
     * POST /admin/services
     */
    async createService(serviceData: CreateServiceRequest): Promise<CreateServiceResponse> {
        return apiClient.post<CreateServiceResponse>('/admin/services', serviceData)
    }

    /**
     * Update service
     * PUT /admin/services/{id}
     */
    async updateService(id: number, serviceData: UpdateServiceRequest): Promise<ServiceDetailResponse> {
        return apiClient.put<ServiceDetailResponse>(`/admin/services/${id}`, serviceData)
    }

    /**
     * Delete service
     * DELETE /admin/services/{id}
     */
    async deleteService(id: number): Promise<void> {
        return apiClient.delete<void>(`/admin/services/${id}`)
    }
}

export const servicesService = new ServicesService()
