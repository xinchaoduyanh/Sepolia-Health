import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// Body cho POST /internal/bridge/booking-drafts (DATA-only, do AI/ gửi).
export const CreateBookingDraftSchema = z.object({
  patientProfileId: z.number().int().positive(),
  doctorId: z.number().int().positive(),
  serviceId: z.number().int().positive(),
  startTime: z.string().min(1), // ISO datetime
  idempotencyKey: z.string().min(1),
});

export class CreateBookingDraftDto extends createZodDto(
  CreateBookingDraftSchema,
) {}

export const ConfirmBookingSchema = z.object({
  idempotencyKey: z.string().min(1),
});

export class ConfirmBookingDto extends createZodDto(ConfirmBookingSchema) {}
