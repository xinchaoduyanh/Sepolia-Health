import { AppointmentDetailResponse } from '@/types/appointment'
import { apiClient } from '../api-client'

export class AppointmentService {
	/**
	 * Get appointment by ID
	 * GET /receptionist/appointment/:id
	 */
	async getAppointmentById(id: number): Promise<AppointmentDetailResponse> {
		return apiClient.get<AppointmentDetailResponse>(`/receptionist/appointment/${id}`)
	}
}

export const appointmentService = new AppointmentService()
