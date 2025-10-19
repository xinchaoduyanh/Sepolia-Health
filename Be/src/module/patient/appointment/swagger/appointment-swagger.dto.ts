import { createZodDto } from 'nestjs-zod';
import {
  UpdateAppointmentDto as UpdateAppointmentZodDto,
  GetAppointmentsQueryDto as GetAppointmentsQueryZodDto,
} from '../appointment.dto';

// Create Swagger DTOs from Zod schemas
export class UpdateAppointmentDto extends createZodDto(
  UpdateAppointmentZodDto,
) {}
export class GetAppointmentsQueryDto extends createZodDto(
  GetAppointmentsQueryZodDto,
) {}
