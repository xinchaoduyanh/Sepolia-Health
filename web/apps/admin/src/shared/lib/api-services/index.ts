// Export all API services
export * from './auth.service'
export * from './statistics.service'

// Export specific services to avoid naming conflicts
export {
    usersService,
    type User,
    type DoctorProfile as UsersDoctorProfile,
    type ReceptionistProfile as UsersReceptionistProfile,
} from './users.service'
export {
    patientsService,
    type Patient,
    type PatientProfile,
    type PatientsListParams,
    type PatientsListResponse,
    type CreatePatientRequest,
    type UpdatePatientRequest,
} from './patients.service'
export { doctorsService } from './doctors.service'
export {
    doctorScheduleService,
    type WeeklyScheduleResponse,
    type WeeklyScheduleDay,
    type BookedTimeSlot,
} from './doctor-schedule.service'
export { receptionistsService } from './receptionists.service'
export { articlesService } from './articles.service'
export { servicesService } from './services.service'
export { clinicsService } from './clinics.service'
export { uploadService } from './upload.service'
export { chatService, type ChatChannel, type Clinic, type ChatChannelResponse } from './chat.service'
export { videoService, type VideoTokenResponse } from './video.service'
export {
    qnaService,
    type Question,
    type QuestionDetail,
    type Answer,
    type Tag,
    type QuestionFilters,
    type QuestionsListResponse,
    type CreateAnswerRequest,
    type VoteRequest,
    type VoteType,
    type SetBestAnswerRequest,
} from './qna.service'
export {
    appTermsService,
    type AppTerms,
    type AppTermsType,
    type AppTermsListParams,
    type AppTermsListResponse,
    type AppTermsDetailResponse,
    type CreateAppTermsRequest,
    type UpdateAppTermsRequest,
} from './app-terms.service'
export {
    promotionsService,
    type Promotion,
    type PromotionsListParams,
    type PromotionsListResponse,
    type CreatePromotionRequest,
    type UpdatePromotionRequest,
} from './promotions.service'
export {
    promotionDisplaysService,
    type PromotionDisplay,
    type CreatePromotionDisplayRequest,
    type UpdatePromotionDisplayRequest,
    type ApplyPromotionRequest,
} from './promotion-displays.service'

// Re-export API client
export { apiClient } from '../api-client'
