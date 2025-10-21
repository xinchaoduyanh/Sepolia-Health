import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const resetPasswordSchema = z.object({
  email: z.email(),
  otp: z.string(),
  newPassword: z.string(),
});

export class ResetPasswordBodyDto extends createZodDto(resetPasswordSchema) {}
