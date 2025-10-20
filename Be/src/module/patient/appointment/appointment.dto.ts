import { z } from 'zod';
import { AppointmentStatus, PaymentStatus, Gender } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';

// Helper function to convert Prisma enum to array
const appointmentStatusValues = Object.values(AppointmentStatus) as [
  string,
  ...string[],
];
const paymentStatusValues = Object.values(PaymentStatus) as [
  string,
  ...string[],
];
const genderValues = Object.values(Gender) as [string, ...string[]];

// Create Appointment DTO
export const CreateAppointmentSchema = z.object({
  doctorId: z.number().min(1, 'Bác sĩ không được để trống'),
  serviceId: z.number().min(1, 'Dịch vụ không được để trống'),
  date: z.iso.datetime('Ngày hẹn không hợp lệ'),
  notes: z.string().optional(),
  // Patient information (required for all appointments)
  patientName: z.string().min(1, 'Họ tên không được để trống'),
  patientDob: z.string().date('Ngày sinh không hợp lệ'),
  patientPhone: z.string().min(10, 'Số điện thoại không hợp lệ'),
  patientGender: z.enum(genderValues, 'Giới tính không hợp lệ'),
  clinicId: z.number().min(1, 'Cơ sở phòng khám không được để trống'),
});

// Create Appointment from DoctorService DTO
export const CreateAppointmentFromDoctorServiceDto = z.object({
  doctorServiceId: z.number().min(1, 'Dịch vụ bác sĩ không được để trống'),
  date: z.string().date('Ngày hẹn không hợp lệ'),
  startTime: z
    .string()
    .regex(
      /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      'Thời gian bắt đầu không hợp lệ (HH:mm)',
    ),
  notes: z.string().optional(),
  // Patient profile ID (optional - if not provided, will use null)
  patientProfileId: z.number().optional(),
  // Patient information (required for all appointments)
  patientName: z.string().min(1, 'Họ tên không được để trống'),
  patientDob: z.string().date('Ngày sinh không hợp lệ'),
  patientPhone: z.string().min(10, 'Số điện thoại không hợp lệ'),
  patientGender: z.enum(genderValues, 'Giới tính không hợp lệ'),
});

// Update Appointment DTO
export const UpdateAppointmentSchema = z.object({
  date: z.string().date('Ngày hẹn không hợp lệ').optional(),
  startTime: z
    .string()
    .regex(
      /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      'Thời gian bắt đầu không hợp lệ (HH:mm)',
    )
    .optional(),
  status: z.enum(appointmentStatusValues).optional(),
  paymentStatus: z.enum(paymentStatusValues).optional(),
  notes: z.string().optional(),
});

// Get Appointments Query DTO
export const GetAppointmentsQuerySchema = z.object({
  page: z
    .string()
    .transform(Number)
    .default(() => 1),
  limit: z
    .string()
    .transform(Number)
    .default(() => 10),
  status: z.enum(appointmentStatusValues).optional(),
  paymentStatus: z.enum(paymentStatusValues).optional(),
  doctorId: z.number().optional(),
  patientId: z.number().optional(),
  dateFrom: z.iso.datetime().optional(),
  dateTo: z.iso.datetime().optional(),
});

// Response DTOs
export const AppointmentResponseDto = z.object({
  id: z.number(),
  date: z.iso.datetime(),
  startTime: z.string(),
  endTime: z.string(),
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
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const AppointmentsListResponseDto = z.object({
  appointments: z.array(AppointmentResponseDto),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});

// Export types
export type CreateAppointmentDtoType = z.infer<typeof CreateAppointmentSchema>;
export type CreateAppointmentFromDoctorServiceDtoType = z.infer<
  typeof CreateAppointmentFromDoctorServiceDto
>;
export type GetAppointmentsQueryDtoType = z.infer<
  typeof GetAppointmentsQuerySchema
>;
export type AppointmentResponseDtoType = z.infer<typeof AppointmentResponseDto>;
export type AppointmentsListResponseDtoType = z.infer<
  typeof AppointmentsListResponseDto
>;
export class UpdateAppointmentDto extends createZodDto(
  UpdateAppointmentSchema,
) {}
export class GetAppointmentsQueryDto extends createZodDto(
  GetAppointmentsQuerySchema,
) {}
