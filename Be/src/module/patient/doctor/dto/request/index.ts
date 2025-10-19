import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const GetDoctorServiceSchema = z.object({
  page: z.number(),
  limit: z.number(),
});
export class GetDoctorServiceQueryDto extends createZodDto(
  GetDoctorServiceSchema,
) {}

const createDoctorProfileSchema = z.object({
  firstName: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
  lastName: z.string().min(2, 'Họ phải có ít nhất 2 ký tự'),
  specialty: z.string(),
  experience: z.string().optional(),
  contactInfo: z.string().optional(),
  serviceIds: z.array(z.number()),
});
export class CreateDoctorProfileBodyDto extends createZodDto(
  createDoctorProfileSchema,
) {}

const updateDoctorProfileSchema = z.object({
  firstName: z.string().min(2, 'Tên phải có ít nhất 2 ký tự').optional(),
  lastName: z.string().min(2, 'Họ phải có ít nhất 2 ký tự').optional(),
  specialty: z.string().optional(),
  experience: z.string().optional(),
  contactInfo: z.string().optional(),
  serviceIds: z.array(z.number()).optional(),
});
export class updateDoctorProfileBodyDto extends createZodDto(
  updateDoctorProfileSchema,
) {}
