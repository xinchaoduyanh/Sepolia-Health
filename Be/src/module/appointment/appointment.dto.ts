import { z } from 'zod';

// Create Appointment DTO
export const CreateAppointmentDto = z.object({
  doctorId: z.number().min(1, 'Bác sĩ không được để trống'),
  serviceId: z.number().min(1, 'Dịch vụ không được để trống'),
  date: z.iso.datetime('Ngày hẹn không hợp lệ'),
  notes: z.string().optional(),
  // Patient information (required for all appointments)
  patientName: z.string().min(1, 'Họ tên không được để trống'),
  patientDob: z.iso.datetime('Ngày sinh không hợp lệ'),
  patientPhone: z.string().min(10, 'Số điện thoại không hợp lệ'),
  patientGender: z.enum(['MALE', 'FEMALE', 'OTHER'], 'Giới tính không hợp lệ'),
  clinicId: z.number().min(1, 'Cơ sở phòng khám không được để trống'),
});

// Update Appointment DTO
export const UpdateAppointmentDto = z.object({
  date: z.iso.datetime('Ngày hẹn không hợp lệ').optional(),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED']).optional(),
  paymentStatus: z.enum(['PENDING', 'PAID', 'REFUNDED']).optional(),
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
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED']).optional(),
  paymentStatus: z.enum(['PENDING', 'PAID', 'REFUNDED']).optional(),
  doctorId: z.number().optional(),
  patientId: z.number().optional(),
  dateFrom: z.iso.datetime().optional(),
  dateTo: z.iso.datetime().optional(),
});

// Response DTOs
export const AppointmentResponseDto = z.object({
  id: z.number(),
  date: z.iso.datetime(),
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
    id: z.number(),
    specialty: z.string(),
    user: z.object({
      id: z.number(),
      firstName: z.string(),
      lastName: z.string(),
    }),
  }),
  service: z.object({
    id: z.number(),
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
