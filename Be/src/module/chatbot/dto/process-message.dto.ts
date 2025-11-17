import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// Process Message Schema
export const ProcessMessageSchema = z.object({
  message: z
    .string()
    .min(1, 'Message không được để trống')
    .max(2000, 'Message tối đa 2000 ký tự'),
  channelId: z.string().optional(),
  userId: z.string().optional(),
});

export class ProcessMessageDto extends createZodDto(ProcessMessageSchema) {}

// Doctor Schedule Query Schema
export const DoctorScheduleQuerySchema = z.object({
  doctorId: z.coerce.number().positive().optional(),
  doctorName: z.string().optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date phải theo format YYYY-MM-DD')
    .optional(),
  serviceId: z.coerce.number().positive().optional(),
});

export class DoctorScheduleQueryDto extends createZodDto(
  DoctorScheduleQuerySchema,
) {}

// Health Advice Schema
export const HealthAdviceSchema = z.object({
  symptoms: z.array(z.string()).min(1, 'Phải có ít nhất 1 triệu chứng'),
  condition: z.string().optional(),
  age: z.coerce.number().min(0).max(150).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  medicalHistory: z.array(z.string()).optional(),
});

export class HealthAdviceDto extends createZodDto(HealthAdviceSchema) {}
