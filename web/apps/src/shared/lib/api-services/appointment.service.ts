import { AppointmentDetailResponse } from '@/types/appointment'
import { apiClient } from '../api-client'

export interface AppointmentListParams {
	page?: number
	limit?: number
	search?: string
	status?: string
	startDate?: string
	endDate?: string
}

export interface AppointmentListResponse {
	data: AppointmentDetailResponse[]
	total: number
	page: number
	limit: number
	totalPages: number
}

export interface AppointmentSummary {
	appointmentStatus: string
	count: number
}

export class AppointmentService {
	/**
	 * Get appointment by ID
	 * GET /receptionist/appointment/:id
	 */
	async getAppointmentById(id: number): Promise<AppointmentDetailResponse> {
		return apiClient.get<AppointmentDetailResponse>(`/receptionist/appointment/${id}`)
	}

	/**
	 * Get list of appointments with pagination and filters
	 * GET /receptionist/appointment
	 */
	async getAppointments(params: AppointmentListParams = {}): Promise<AppointmentListResponse> {
		// Filter out null/undefined values
		const filteredParams = Object.fromEntries(
			Object.entries(params).filter(([_, value]) => value != null && value !== '')
		)
		return apiClient.get<AppointmentListResponse>('/receptionist/appointment', { params: filteredParams })
	}

	/**
	 * Get appointment summary statistics
	 * GET /receptionist/appointment/summary
	 */
	async getAppointmentSummary(): Promise<AppointmentSummary[]> {
		return apiClient.get<AppointmentSummary[]>('/receptionist/appointment/summary')
	}

	/**
	 * Check in an appointment
	 * PATCH /receptionist/appointment/:appointmentId/check-in
	 */
	async checkInAppointment(appointmentId: number): Promise<{ message: string }> {
		return apiClient.patch<{ message: string }>(`/receptionist/appointment/${appointmentId}/check-in`)
	}

	/**
	 * Update an appointment
	 * PATCH /receptionist/appointment/:id
	 */
	async updateAppointment(
		appointmentId: number,
		data: { startTime?: string; notes?: string; doctorServiceId?: number }
	): Promise<{ message: string }> {
		return apiClient.patch<{ message: string }>(`/receptionist/appointment/${appointmentId}`, data)
	}

	/**
	 * Cancel an appointment
	 * PATCH /receptionist/appointment/:id/cancel
	 */
	async cancelAppointment(appointmentId: number): Promise<{ message: string }> {
		return apiClient.patch<{ message: string }>(`/receptionist/appointment/${appointmentId}/cancel`)
	}

	/**
	 * Find patient by email and their upcoming appointments
	 * POST /receptionist/appointment/find-patient
	 */
	async findPatientByEmail(email: string): Promise<{ data: AppointmentDetailResponse[] }> {
		return apiClient.post<{ data: AppointmentDetailResponse[] }>('/receptionist/appointment/find-patient', { email })
	}
}

export const appointmentService = new AppointmentService()

