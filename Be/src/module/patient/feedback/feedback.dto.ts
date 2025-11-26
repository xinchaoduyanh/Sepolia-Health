import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

// Request DTO Schema
export const CreateFeedbackSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().optional(),
});

export class CreateFeedbackDto extends createZodDto(CreateFeedbackSchema) {}

// Response DTOs
export class FeedbackResponseDto {
  @ApiProperty({
    description: 'ID feedback',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Đánh giá (số sao)',
    example: 5,
  })
  rating: number;

  @ApiProperty({
    description: 'Ghi chú, lưu ý',
    example: 'Bác sĩ rất tận tâm và chuyên nghiệp',
    nullable: true,
  })
  comment?: string | null;

  @ApiProperty({
    description: 'ID appointment',
    example: 1,
  })
  appointmentId: number;

  @ApiProperty({
    description: 'Thời điểm tạo',
    example: '2024-12-01T00:00:00.000Z',
  })
  createdAt: Date;
}
