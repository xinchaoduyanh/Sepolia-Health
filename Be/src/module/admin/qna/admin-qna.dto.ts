import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import {
  QuestionDetailResponseDto,
  AnswerResponseDto,
  QuestionsListResponseDto,
} from '@/module/qna/qna.dto';

// Query schema for admin
export const GetAdminQuestionsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  tagIds: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(',').map(Number) : undefined)),
  authorId: z.coerce.number().int().positive().optional(),
  includeDeleted: z.coerce.boolean().default(false),
});

export class GetAdminQuestionsQueryDto extends createZodDto(
  GetAdminQuestionsQuerySchema,
) {}

// Response DTOs reuse from main QNA module
export class AdminQuestionDetailResponseDto extends QuestionDetailResponseDto {}
export class AdminQuestionsListResponseDto extends QuestionsListResponseDto {}
export class AdminAnswerResponseDto extends AnswerResponseDto {}

// Query DTO class for Swagger
export class GetAdminQuestionsQueryDtoClass {
  @ApiProperty({ required: false, minimum: 1 })
  page?: number;

  @ApiProperty({ required: false, minimum: 1, maximum: 100 })
  limit?: number;

  @ApiProperty({ required: false })
  search?: string;

  @ApiProperty({ required: false })
  tagIds?: string;

  @ApiProperty({ required: false })
  authorId?: number;

  @ApiProperty({ required: false, default: false })
  includeDeleted?: boolean;
}


