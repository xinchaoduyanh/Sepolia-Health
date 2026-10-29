import { z } from 'zod';

/**
 * Schema output của các tool quan trọng (contract AI/ <-> Be/). Lỗi nghiệp vụ luôn là
 * `{ error_code }` với mã snake_case ổn định — không message/stack. Dùng trong test
 * contract để output không trôi khỏi những gì AI/app/tools mong đợi.
 */
export const ErrorCodeSchema = z.object({
  error_code: z.string().regex(/^[a-z][a-z0-9_]{2,63}$/),
});

export const BookingRecapSchema = z.object({
  doctor_id: z.number().int(),
  doctor_name: z.string(),
  service_id: z.number().int(),
  service_name: z.string(),
  start_time: z.string().datetime({ offset: true }),
  price: z.number(),
  clinic_id: z.number().int().nullable(),
  clinic_name: z.string().nullable(),
  patient_profile_id: z.number().int(),
  patient_name: z.string().nullable(),
  appointment_type: z.literal('OFFLINE'),
});

export const BookingDraftResponseSchema = z.union([
  ErrorCodeSchema.extend({
    conflicts: z
      .array(z.object({ appointment_id: z.number().int(), start_time: z.string() }))
      .optional(),
  }),
  z.object({
    draft_id: z.string().min(1),
    expires_at: z.string().datetime({ offset: true }),
    conflicts: z.array(z.unknown()),
    recap_data: BookingRecapSchema,
    already_confirmed: z.boolean().optional(),
    confirmed_appointment_id: z.number().int().nullable().optional(),
    draft_refreshed: z.boolean().optional(),
  }),
]);

export const ConfirmBookingResponseSchema = z.union([
  ErrorCodeSchema,
  z.object({ appointment_id: z.number().int(), status: z.literal('booked') }),
]);

export const CancelAppointmentResponseSchema = z.union([
  ErrorCodeSchema,
  z.object({
    success: z.literal(true),
    already_cancelled: z.boolean().optional(),
    appointment_id: z.number().int().optional(),
    status: z.literal('CANCELLED').optional(),
  }),
]);

export const SearchServicesResponseSchema = z.object({
  services: z.array(
    z.object({
      id: z.number().int(),
      name: z.string(),
      price: z.number(),
      duration_min: z.number().int(),
      specialty: z.string().nullable(),
    }),
  ),
  clinic_id: z.number().int().nullable(),
});
