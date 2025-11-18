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

// Search Doctors Schema
export const SearchDoctorsSchema = z.object({
  doctorName: z.string().min(1, 'Tên bác sĩ không được để trống'),
  locationName: z.string().optional(), // Đổi từ clinicId sang locationName
  serviceId: z.coerce.number().positive().optional(),
  specialtyName: z.string().optional(), // Tên chuyên khoa để kiểm tra mâu thuẫn
});

export class SearchDoctorsDto extends createZodDto(SearchDoctorsSchema) {}

// Stream Chat Webhook Payload Schema
export const StreamChatWebhookSchema = z.object({
  type: z.string().describe('Event type, e.g., "message.new"'),
  channel_id: z.string().describe('Channel ID where message was sent'),
  message: z
    .object({
      id: z.string().describe('Message ID'),
      text: z.string().describe('Message text content'),
      user: z
        .object({
          id: z.string().describe('User ID who sent the message'),
          name: z.string().optional().describe('User name'),
        })
        .describe('User information'),
    })
    .describe('Message object'),
});

export class StreamChatWebhookDto extends createZodDto(
  StreamChatWebhookSchema,
) {}
