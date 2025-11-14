import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { VoteType } from '@prisma/client';

// ========== QUERY SCHEMAS ==========

export const GetQuestionsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  tagIds: z
    .union([z.string(), z.array(z.string()), z.array(z.number())])
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      if (Array.isArray(val)) {
        return val
          .map((v) => (typeof v === 'string' ? Number(v) : v))
          .filter((v) => !isNaN(v));
      }
      return val
        .split(',')
        .map(Number)
        .filter((v) => !isNaN(v));
    }),
  sortBy: z
    .enum(['newest', 'mostVoted', 'mostAnswered', 'unanswered'])
    .default('newest'),
});

export class GetQuestionsQueryDto extends createZodDto(
  GetQuestionsQuerySchema,
) {}

// ========== QUESTION SCHEMAS ==========

export const CreateQuestionSchema = z.object({
  title: z
    .string()
    .min(1, 'Tiêu đề không được để trống')
    .max(200, 'Tiêu đề quá dài'),
  content: z.string().min(1, 'Nội dung không được để trống'),
  tagIds: z
    .array(z.number().int().positive())
    .min(1, 'Phải có ít nhất 1 tag')
    .max(5, 'Tối đa 5 tags'),
});

export class CreateQuestionDto extends createZodDto(CreateQuestionSchema) {}

export const UpdateQuestionSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  tagIds: z.array(z.number().int().positive()).max(5).optional(),
  reason: z.string().max(500).optional(),
});

export class UpdateQuestionDto extends createZodDto(UpdateQuestionSchema) {}

// ========== ANSWER SCHEMAS ==========

export const CreateAnswerSchema = z.object({
  content: z.string().min(1, 'Nội dung không được để trống'),
});

export class CreateAnswerDto extends createZodDto(CreateAnswerSchema) {}

export const UpdateAnswerSchema = z.object({
  content: z.string().min(1).optional(),
  reason: z.string().max(500).optional(),
});

export class UpdateAnswerDto extends createZodDto(UpdateAnswerSchema) {}

// ========== VOTE SCHEMAS ==========

export const VoteSchema = z.object({
  voteType: z.nativeEnum(VoteType),
});

export class VoteDto extends createZodDto(VoteSchema) {}

// ========== BEST ANSWER SCHEMA ==========

export const SetBestAnswerSchema = z.object({
  answerId: z.number().int().positive(),
});

export class SetBestAnswerDto extends createZodDto(SetBestAnswerSchema) {}

// ========== DTO CLASSES FOR SWAGGER ==========

export class CreateQuestionDtoClass {
  @ApiProperty({
    description: 'Tiêu đề câu hỏi',
    example: 'Làm thế nào để chăm sóc sức khỏe tim mạch?',
  })
  title: string;

  @ApiProperty({
    description: 'Nội dung câu hỏi',
    example: 'Tôi muốn biết các cách chăm sóc sức khỏe tim mạch tại nhà...',
  })
  content: string;

  @ApiProperty({
    description: 'Danh sách ID của tags',
    example: [1, 2, 3],
    type: [Number],
  })
  tagIds: number[];
}

export class UpdateQuestionDtoClass {
  @ApiProperty({
    description: 'Tiêu đề câu hỏi',
    required: false,
  })
  title?: string;

  @ApiProperty({
    description: 'Nội dung câu hỏi',
    required: false,
  })
  content?: string;

  @ApiProperty({
    description: 'Danh sách ID của tags',
    required: false,
    type: [Number],
  })
  tagIds?: number[];

  @ApiProperty({
    description: 'Lý do chỉnh sửa',
    required: false,
  })
  reason?: string;
}

export class CreateAnswerDtoClass {
  @ApiProperty({
    description: 'Nội dung câu trả lời',
    example: 'Để chăm sóc sức khỏe tim mạch, bạn nên...',
  })
  content: string;
}

export class UpdateAnswerDtoClass {
  @ApiProperty({
    description: 'Nội dung câu trả lời',
    required: false,
  })
  content?: string;

  @ApiProperty({
    description: 'Lý do chỉnh sửa',
    required: false,
  })
  reason?: string;
}

export class VoteDtoClass {
  @ApiProperty({
    description: 'Loại vote',
    enum: VoteType,
    example: VoteType.UP,
  })
  voteType: VoteType;
}

export class SetBestAnswerDtoClass {
  @ApiProperty({
    description: 'ID của câu trả lời',
    example: 1,
  })
  answerId: number;
}

export class GetQuestionsQueryDtoClass {
  @ApiProperty({ required: false, minimum: 1 })
  page?: number;

  @ApiProperty({ required: false, minimum: 1, maximum: 100 })
  limit?: number;

  @ApiProperty({ required: false })
  search?: string;

  @ApiProperty({ required: false })
  tagIds?: string;

  @ApiProperty({
    enum: ['newest', 'mostVoted', 'mostAnswered', 'unanswered'],
    required: false,
  })
  sortBy?: string;
}

// ========== RESPONSE DTOs ==========

export class AuthorDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  role: string;

  @ApiProperty({ required: false })
  avatar?: string;
}

export class TagDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;
}

export class QuestionResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  title: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  views: number;

  @ApiProperty()
  upvotes: number;

  @ApiProperty()
  downvotes: number;

  @ApiProperty()
  voteScore: number;

  @ApiProperty()
  answerCount: number;

  @ApiProperty()
  hasBestAnswer: boolean;

  @ApiProperty({ type: AuthorDto })
  author: AuthorDto;

  @ApiProperty({ type: [TagDto] })
  tags: TagDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class AnswerResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  content: string;

  @ApiProperty()
  upvotes: number;

  @ApiProperty()
  downvotes: number;

  @ApiProperty()
  voteScore: number;

  @ApiProperty()
  isBestAnswer: boolean;

  @ApiProperty({ type: AuthorDto })
  author: AuthorDto;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class EditHistoryItemDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ required: false })
  oldTitle?: string;

  @ApiProperty({ required: false })
  newTitle?: string;

  @ApiProperty({ required: false })
  oldContent?: string;

  @ApiProperty({ required: false })
  newContent?: string;

  @ApiProperty({ required: false })
  reason?: string;

  @ApiProperty({ type: AuthorDto })
  editor: AuthorDto;

  @ApiProperty()
  createdAt: Date;
}

export class QuestionDetailResponseDto extends QuestionResponseDto {
  @ApiProperty({ type: [AnswerResponseDto] })
  answers: AnswerResponseDto[];

  @ApiProperty({ type: [EditHistoryItemDto] })
  editHistory: EditHistoryItemDto[];
}

export class QuestionsListResponseDto {
  @ApiProperty({ type: [QuestionResponseDto] })
  questions: QuestionResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}

export class AnswersListResponseDto {
  @ApiProperty({ type: [AnswerResponseDto] })
  answers: AnswerResponseDto[];

  @ApiProperty()
  total: number;
}

export class TagResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty()
  usageCount: number;
}

export class TagsListResponseDto {
  @ApiProperty({ type: [TagResponseDto] })
  tags: TagResponseDto[];
}

export class CreateQuestionResponseDto extends QuestionResponseDto {}
export class UpdateQuestionResponseDto extends QuestionResponseDto {}
export class CreateAnswerResponseDto extends AnswerResponseDto {}
export class UpdateAnswerResponseDto extends AnswerResponseDto {}
