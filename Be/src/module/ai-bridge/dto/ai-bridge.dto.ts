import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// Body cho POST /internal/bridge/booking-drafts (DATA-only, do AI/ gửi).
const ISO_DATETIME_WITH_TZ =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

export const CreateBookingDraftSchema = z.object({
  patientProfileId: z.number().int().positive(),
  doctorId: z.number().int().positive(),
  serviceId: z.number().int().positive(),
  // ISO-8601 BẮT BUỘC có timezone (Z hoặc ±hh:mm): không đoán giờ local của server.
  startTime: z
    .string()
    .regex(ISO_DATETIME_WITH_TZ, 'startTime must be ISO-8601 with timezone')
    .refine((v) => !Number.isNaN(Date.parse(v)), 'startTime is not a valid datetime'),
  idempotencyKey: z.string().min(1).max(128),
});

export class CreateBookingDraftDto extends createZodDto(
  CreateBookingDraftSchema,
) {}

export const ConfirmBookingSchema = z.object({
  idempotencyKey: z.string().min(1).max(128),
});

export class ConfirmBookingDto extends createZodDto(ConfirmBookingSchema) {}
