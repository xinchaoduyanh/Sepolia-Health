// Export all API functions and hooks
export * from './auth';
export * from './user';
export * from './payment';
export * from './chat';

// Appointments exports (excluding conflicting useServices)
export {
  appointmentApi,
  useAppointments,
  useAppointment,
  useCreateAppointment,
  useUpdateAppointment,
  useDeleteAppointment,
  useMyAppointments,
  useDoctorAppointments,
  useLocations,
  useDoctorServices,
  useAvailableDates,
  useDoctorAvailability,
  appointmentKeys,
  useServices as useAppointmentServices,
} from './appointments';

// Doctors exports (excluding conflicting useServices)
export {
  doctorApi,
  useDoctorsByService,
  useDoctorTimeslots,
  doctorKeys,
  serviceKeys,
  useServices as useDoctorServiceList,
} from './doctors';

// Export API client
export { default as apiClient } from '@/lib/api-client';

// Export config
export * from '@/lib/config';
