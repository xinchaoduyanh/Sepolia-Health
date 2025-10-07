import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const schema = z.object({
  experience: z.string().optional(),
  specialty: z.string(),
  contactInfo: z.string(),
  wokingHourse: z.string(),
});

export class CreateDoctorDto extends createZodDto(schema) {}
