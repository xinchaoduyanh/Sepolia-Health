import { Period } from '@prisma/client';
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
  specialty: z.string(),
  experience: z.string().optional(),
  contactInfo: z.string().optional(),
  serviceIds: z.array(z.number()),
  timeslots: z.object({
    period: z.enum(Period),
    slot: z.number(),
  }),
});
export class CreateDoctorProfileBodyDto extends createZodDto(
  createDoctorProfileSchema,
) {}

const updateDoctorProfileSchema = z.object({
  specialty: z.string().optional(),
  experience: z.string().optional(),
  contactInfo: z.string().optional(),
  serviceIds: z.array(z.number()).optional(),
  timeslots: z
    .object({
      id: z.number(),
      slot: z.number(),
    })
    .optional(),
});
export class updateDoctorProfileBodyDto extends createZodDto(
  updateDoctorProfileSchema,
) {}
