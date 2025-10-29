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
export { receptionistsService } from './receptionists.service'
export { articlesService } from './articles.service'
export { servicesService } from './services.service'
export { clinicsService } from './clinics.service'
export { uploadService } from './upload.service'

// Re-export API client
export { apiClient } from '../api-client'
