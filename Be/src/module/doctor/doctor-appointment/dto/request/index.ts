import { createZodDto } from 'nestjs-zod';
import z from 'zod';

// Create/Update Appointment Result Schema
export const CreateAppointmentResultSchema = z.object({
  diagnosis: z.string().optional(),
  notes: z.string().optional(),
  prescription: z.string().optional(),
  recommendations: z.string().optional(),
});

export class CreateAppointmentResultDto extends createZodDto(
  CreateAppointmentResultSchema,
) {}

// Get Appointments Query Schema
export const GetDoctorAppointmentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(10).optional(),
  status: z.enum(['UPCOMING', 'ON_GOING', 'COMPLETED', 'CANCELLED']).optional(),
  sortBy: z.enum(['startTime', 'createdAt']).default('startTime').optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc').optional(),
  hasResult: z.enum(['hasResult', 'noResult']).optional(),
});

export class GetDoctorAppointmentsQueryDto extends createZodDto(
  GetDoctorAppointmentsQuerySchema,
) {}
