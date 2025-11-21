import { SortOrder } from '@/common/enum';
import { DateUtil } from '@/common/utils';
import { AppointmentStatus, PaymentStatus } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

// Get Appointments Query DTO
const GetAppointmentsQuerySchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
  status: z.enum(AppointmentStatus).optional(),
  billingStatus: z.enum(PaymentStatus).optional(),
  doctorId: z.coerce.number().optional(),
  patientId: z.coerce.number().optional(),
  dateFrom: z.iso.datetime().optional(),
  dateTo: z.iso.datetime().optional(),
  sortBy: z.enum(['date', 'status', 'billingStatus']).default('date'),
  sortOrder: z.enum(SortOrder).default(SortOrder.DESC),
});

// Create Appointment from DoctorService DTO
export const CreateAppointmentFromDoctorServiceSchema = z.object({
  doctorServiceId: z.coerce.number(),
  patientProfileId: z.coerce.number(),
  startTime: z.iso.datetime().transform((val) => new Date(val)),
  endTime: z.iso.datetime().transform((val) => new Date(val)),
  notes: z.string().optional(),
}).refine((data) => data.startTime < data.endTime, {
  message: 'startTime must be earlier than endTime',
  path: ['startTime'],
}).refine((data) => data.startTime >= new Date(), {
  message: 'startTime must not be in the past',
  path: ['startTime'],
});


export class GetAppointmentsQueryDto extends createZodDto(
  GetAppointmentsQuerySchema,
) {}

export class CreateAppointmentFromDoctorServiceBodyDto extends createZodDto(
  CreateAppointmentFromDoctorServiceSchema,
) {}

const UpdateAppointmentSchema = z.object({
  startTime: z.iso.datetime().transform((val) => new Date(val)),
  endTime: z.iso.datetime().transform((val) => new Date(val)),
  notes: z.string().optional(),
}).refine((data) => data.startTime < data.endTime, {
  message: 'startTime must be earlier than endTime',
  path: ['startTime'],
}).refine((data) => data.startTime >= new Date(), {
  message: 'startTime must not be in the past',
  path: ['startTime'],
}); 
export class UpdateAppointmentDto extends createZodDto(
  UpdateAppointmentSchema,
) {}

// Booking dto
const GetDoctorServicesSchema = z.object({
  locationId: z.coerce.number(),
  serviceId: z.coerce.number(),
});

const GetAvailableDatesSchema = z
  .object({
    doctorServiceId: z.coerce.number(),
    startTime: z.iso.datetime().transform((val) => new Date(val)),
    endTime: z.iso.datetime().transform((val) => new Date(val)),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: 'startTime must be earlier than endTime',
    path: ['startTime'],
  })
  .refine((data) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    return data.startTime >= today;
  }, {
    message: 'startTime must not be in the past',
    path: ['startTime'],
  });

const GetDoctorAvailabilitySchema = z
  .object({
    doctorServiceId: z.coerce.number(),
    date: z.iso.date().transform((val) => new Date(val)),
  })
  .refine((data) => DateUtil.startOfDay(data.date) >= DateUtil.startOfDay(new Date()), {
    message: 'date must not be in the past',
    path: ['date'],
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
