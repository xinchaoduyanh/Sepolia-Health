import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';

const markAsPaidSchema = z.object({
  receiptNumber: z.string().optional()
});

export class MarkAsPaidDto extends createZodDto(markAsPaidSchema) {}