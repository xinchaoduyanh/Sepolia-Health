import { AppointmentStatus, Gender, PaymentStatus } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

// Get Appointments Query DTO
const GetAppointmentsQuerySchema = z.object({
  page: z.coerce.number().default(() => 1),
  limit: z.coerce.number().default(() => 10),
  status: z.enum(AppointmentStatus).optional(),
  paymentStatus: z.enum(PaymentStatus).optional(),
  doctorId: z.coerce.number().optional(),
  patientId: z.coerce.number().optional(),
  dateFrom: z.iso.datetime().optional(),
  dateTo: z.iso.datetime().optional(),
});

// Create Appointment DTO
export const CreateAppointmentSchema = z.object({
  doctorId: z.coerce.number().min(1, 'Bác sĩ không được để trống'),
  serviceId: z.coerce.number().min(1, 'Dịch vụ không được để trống'),
  date: z.iso.datetime('Ngày hẹn không hợp lệ'),
  notes: z.string().optional(),
  // Patient information (required for all appointments)
  patientName: z.string().min(1, 'Họ tên không được để trống'),
  patientDob: z.iso.date('Ngày sinh không hợp lệ'),
  patientPhone: z.string().min(10, 'Số điện thoại không hợp lệ'),
  patientGender: z.enum(Gender, 'Giới tính không hợp lệ'),
  clinicId: z.coerce.number().min(1, 'Cơ sở phòng khám không được để trống'),
});

// Update Appointment DTO
export const UpdateAppointmentSchema = z.object({
  date: z.iso.date('Ngày hẹn không hợp lệ').optional(),
  startTime: z
    .string()
    .regex(
      /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      'Thời gian bắt đầu không hợp lệ (HH:mm)',
    )
    .optional(),
  status: z.enum(AppointmentStatus).optional(),
  paymentStatus: z.enum(PaymentStatus).optional(),
  notes: z.string().optional(),
});

// Create Appointment from DoctorService DTO
export const CreateAppointmentFromDoctorServiceSchema = z.object({
  doctorServiceId: z.coerce
    .number()
    .min(1, 'Dịch vụ bác sĩ không được để trống'),
  date: z.iso.date('Ngày hẹn không hợp lệ'),
  startTime: z
    .string()
    .regex(
      /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      'Thời gian bắt đầu không hợp lệ (HH:mm)',
    ),
  notes: z.string().optional(),
  // Patient profile ID (optional - if not provided, will use null)
  patientProfileId: z.coerce.number().optional(),
  // Patient information (required for all appointments)
  patientName: z.string().min(1, 'Họ tên không được để trống'),
  patientDob: z.iso.date('Ngày sinh không hợp lệ'),
  patientPhone: z.string().min(10, 'Số điện thoại không hợp lệ'),
  patientGender: z.enum(Gender, 'Giới tính không hợp lệ'),
});

export class UpdateAppointmentDto extends createZodDto(
  UpdateAppointmentSchema,
) {}

export class CreateAppointmentDto extends createZodDto(
  CreateAppointmentSchema,
) {}

export class GetAppointmentsQueryDto extends createZodDto(
  GetAppointmentsQuerySchema,
) {}

export class CreateAppointmentFromDoctorServiceBodyDto extends createZodDto(
  CreateAppointmentFromDoctorServiceSchema,
) {}

// Booking dto
const GetDoctorServicesSchema = z.object({
  locationId: z.coerce.number(),
  serviceId: z.coerce.number(),
});

const GetAvailableDatesSchema = z.object({
  doctorServiceId: z.coerce.number(),
  startDate: z.iso.date(),
  endDate: z.iso.date(),
});

const GetDoctorAvailabilitySchema = z.object({
  doctorServiceId: z.coerce.number(),
  date: z.iso.date(),
});

export class GetDoctorServicesQueryDto extends createZodDto(
  GetDoctorServicesSchema,
) {}

export class GetAvailableDateQueryDto extends createZodDto(
  GetAvailableDatesSchema,
) {}

export class GetDoctorAvailabilityQueryDto extends createZodDto(
  GetDoctorAvailabilitySchema,
) {}
