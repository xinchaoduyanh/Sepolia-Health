import { z } from 'zod';

// Create Appointment DTO
export const CreateAppointmentDto = z.object({
  doctorId: z.string().min(1, 'Bác sĩ không được để trống'),
  serviceId: z.string().min(1, 'Dịch vụ không được để trống'),
  date: z.string().datetime('Ngày hẹn không hợp lệ'),
  notes: z.string().optional(),
});

// Update Appointment DTO
export const UpdateAppointmentDto = z.object({
  date: z.string().datetime('Ngày hẹn không hợp lệ').optional(),
  status: z.enum(['scheduled', 'completed', 'cancelled']).optional(),
  paymentStatus: z.enum(['pending', 'paid', 'refunded']).optional(),
  notes: z.string().optional(),
});

// Get Appointments Query DTO
export const GetAppointmentsQueryDto = z.object({
  page: z
    .string()
    .transform(Number)
    .default(() => 1),
  limit: z
    .string()
    .transform(Number)
    .default(() => 10),
  status: z.enum(['scheduled', 'completed', 'cancelled']).optional(),
  paymentStatus: z.enum(['pending', 'paid', 'refunded']).optional(),
  doctorId: z.string().optional(),
  patientId: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

// Response DTOs
export const AppointmentResponseDto = z.object({
  id: z.string(),
  date: z.string().datetime(),
  status: z.string(),
  paymentStatus: z.string(),
  notes: z.string().nullable(),
  patient: z.object({
    id: z.number(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
    phone: z.string().nullable(),
  }),
  doctor: z.object({
    id: z.string(),
    specialty: z.string(),
    user: z.object({
      id: z.number(),
      firstName: z.string(),
      lastName: z.string(),
    }),
  }),
  service: z.object({
    id: z.string(),
    name: z.string(),
    price: z.number(),
    duration: z.number(),
  }),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const AppointmentsListResponseDto = z.object({
  data: z.array(AppointmentResponseDto),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});

// Export types
export type CreateAppointmentDtoType = z.infer<typeof CreateAppointmentDto>;
export type UpdateAppointmentDtoType = z.infer<typeof UpdateAppointmentDto>;
export type GetAppointmentsQueryDtoType = z.infer<
  typeof GetAppointmentsQueryDto
>;
export type AppointmentResponseDtoType = z.infer<typeof AppointmentResponseDto>;
export type AppointmentsListResponseDtoType = z.infer<
  typeof AppointmentsListResponseDto
>;
