// Export all API services
export * from './auth.service'
export * from './statistics.service'

// Export specific services to avoid naming conflicts
export * from './users.service'
export {
    patientsService,
    type Patient,
    type PatientProfile,
    type PatientsListParams,
    type PatientsListResponse,
    type CreatePatientRequest,
    type UpdatePatientRequest,
} from './patients.service'
export * from './doctors.service'
export * from './doctor-schedule.service'
export { receptionistsService } from './receptionists.service'
export { articlesService } from './articles.service'
export { servicesService } from './services.service'
export { clinicsService } from './clinics.service'
export { uploadService } from './upload.service'
export { chatService, type ChatChannel, type Clinic, type ChatChannelResponse } from './chat.service'
export { videoService, type VideoTokenResponse } from './video.service'
export * from './qna.service'
export * from './app-terms.service'
export * from './appointment.service'
export * from './doctor-appointment.service'
export * from './promotions.service'
export * from './promotion-displays.service'

// Re-export API client
export { apiClient } from '../api-client'
