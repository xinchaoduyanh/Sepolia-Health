import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const GetDoctorServiceSchema = z.object({
  page: z.number(),
  limit: z.number(),
});

export class GetDoctorServiceQueryDto extends createZodDto(
  GetDoctorServiceSchema,
) {}
