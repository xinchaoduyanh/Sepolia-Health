import { createZodDto } from 'nestjs-zod';
import z from 'zod';

// Create QR Scan DTO
const CreateQrScanSchema = z.object({
  appointmentId: z
    .number()
    .int()
    .positive('Appointment ID phải là số nguyên dương'),
  amount: z.number().positive('Số tiền phải lớn hơn 0'),
});

// QR Scan Response DTO
const QrScanResponseSchema = z.object({
  qrCodeUrl: z.string().url('QR code URL không hợp lệ'),
  transactionId: z.string(),
  amount: z.number(),
  appointmentId: z.number(),
  paymentCode: z.string(),
  expiresAt: z.string(),
});

// SEPAY Webhook Payload DTO (received from SEPAY)
const SepayWebhookPayloadSchema = z.object({
  id: z.number(), // Transaction ID from SEPAY (number, not string)
  gateway: z.string(),
  transactionDate: z.string(),
  accountNumber: z.string(),
  subAccount: z.string().nullable().optional(), // Can be null or undefined
  transferType: z.string(),
  transferAmount: z.number(),
  accumulated: z.number(),
  code: z.string().nullable().optional(), // Can be null or undefined
  content: z.string(), // Nội dung chuyển khoản chứa payment code
  description: z.string(),
  referenceCode: z.string().optional(),
});

// Webhook Response DTO
const SepayWebhookResponseSchema = z.object({
  success: z.boolean(),
  transactionId: z.string(),
});

// Cancel Payment Code DTO
const CancelPaymentCodeSchema = z.object({
  appointmentId: z
    .number()
    .int()
    .positive('Appointment ID phải là số nguyên dương'),
});

// Cancel Payment Code Response DTO
const CancelPaymentCodeResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

// Check Payment Status DTO
const CheckPaymentStatusSchema = z.object({
  appointmentId: z
    .number()
    .int()
    .positive('Appointment ID phải là số nguyên dương'),
});

// Check Payment Status Response DTO
const CheckPaymentStatusResponseSchema = z.object({
  isPaid: z.boolean(),
  paymentStatus: z.enum(['PENDING', 'PAID', 'REFUNDED']),
});

// Apply Voucher DTO
const ApplyVoucherSchema = z.object({
  appointmentId: z
    .number()
    .int()
    .positive('Appointment ID phải là số nguyên dương'),
  userPromotionId: z
    .number()
    .int()
    .positive('User Promotion ID phải là số nguyên dương'),
});

// Apply Voucher Response DTO
const ApplyVoucherResponseSchema = z.object({
  originalAmount: z.number(),
  discountAmount: z.number(),
  finalAmount: z.number(),
  voucherInfo: z.object({
    id: z.number(),
    title: z.string(),
    code: z.string(),
    discountPercent: z.number(),
    maxDiscountAmount: z.number(),
  }),
});

// Update CreateQrScanSchema to include optional userPromotionId
const CreateQrScanSchemaUpdated = z.object({
  appointmentId: z
    .number()
    .int()
    .positive('Appointment ID phải là số nguyên dương'),
  amount: z.number().positive('Số tiền phải lớn hơn 0'),
  userPromotionId: z
    .number()
    .int()
    .positive('User Promotion ID phải là số nguyên dương')
    .optional(),
});

export class CreateQrScanDto extends createZodDto(CreateQrScanSchemaUpdated) {}
export class ApplyVoucherDto extends createZodDto(ApplyVoucherSchema) {}
export class ApplyVoucherResponseDto extends createZodDto(
  ApplyVoucherResponseSchema,
) {}
export class QrScanResponseDto extends createZodDto(QrScanResponseSchema) {}
export class SepayWebhookPayloadDto extends createZodDto(
  SepayWebhookPayloadSchema,
) {}
export class SepayWebhookResponseDto extends createZodDto(
  SepayWebhookResponseSchema,
) {}
export class CancelPaymentCodeDto extends createZodDto(
  CancelPaymentCodeSchema,
) {}
export class CancelPaymentCodeResponseDto extends createZodDto(
  CancelPaymentCodeResponseSchema,
) {}
export class CheckPaymentStatusDto extends createZodDto(
  CheckPaymentStatusSchema,
) {}
export class CheckPaymentStatusResponseDto extends createZodDto(
  CheckPaymentStatusResponseSchema,
) {}
