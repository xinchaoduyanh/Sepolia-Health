import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AdminQnaService } from './admin-qna.service';
import {
  GetAdminQuestionsQueryDto,
  AdminQuestionDetailResponseDto,
  AdminQuestionsListResponseDto,
  AdminAnswerResponseDto,
  GetAdminQuestionsQueryDtoClass,
  GetAdminQuestionsQuerySchema,
} from './admin-qna.dto';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import { Roles } from '@/common/decorators';
import { Role } from '@prisma/client';
import { CustomZodValidationPipe } from '@/common/pipes';
import { z } from 'zod';

@ApiTags('Admin Q&A Management')
@Controller('admin/qna')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminQnaController {
  constructor(private readonly adminQnaService: AdminQnaService) {}

  @Get('questions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy danh sách câu hỏi để admin review' })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách câu hỏi thành công',
    type: AdminQuestionsListResponseDto,
  })
  async getQuestions(
    @Query(new CustomZodValidationPipe(GetAdminQuestionsQuerySchema))
    query: GetAdminQuestionsQueryDto,
  ): Promise<AdminQuestionsListResponseDto> {
    return this.adminQnaService.getQuestions(query);
  }

  @Get('questions/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy chi tiết câu hỏi để admin review' })
  @ApiParam({
    name: 'id',
    description: 'ID của câu hỏi',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy chi tiết câu hỏi thành công',
    type: AdminQuestionDetailResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Câu hỏi không tồn tại' })
  async getQuestionById(
    @Param(
      'id',
      new CustomZodValidationPipe(z.coerce.number().int().positive()),
    )
    id: number,
  ): Promise<AdminQuestionDetailResponseDto> {
    return this.adminQnaService.getQuestionById(id);
  }

  @Delete('questions/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin xóa câu hỏi' })
  @ApiParam({
    name: 'id',
    description: 'ID của câu hỏi',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Xóa câu hỏi thành công',
  })
  @ApiResponse({ status: 404, description: 'Câu hỏi không tồn tại' })
  async deleteQuestion(
    @Param(
      'id',
      new CustomZodValidationPipe(z.coerce.number().int().positive()),
    )
    id: number,
  ): Promise<{ message: string }> {
    return this.adminQnaService.deleteQuestion(id);
  }

  @Get('answers/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy chi tiết câu trả lời để admin review' })
  @ApiParam({
    name: 'id',
    description: 'ID của câu trả lời',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy chi tiết câu trả lời thành công',
    type: AdminAnswerResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Câu trả lời không tồn tại' })
  async getAnswerById(
    @Param(
      'id',
      new CustomZodValidationPipe(z.coerce.number().int().positive()),
    )
    id: number,
  ): Promise<AdminAnswerResponseDto> {
    return this.adminQnaService.getAnswerById(id);
  }

  @Delete('answers/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin xóa câu trả lời' })
  @ApiParam({
    name: 'id',
    description: 'ID của câu trả lời',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Xóa câu trả lời thành công',
  })
  @ApiResponse({ status: 404, description: 'Câu trả lời không tồn tại' })
  async deleteAnswer(
    @Param(
      'id',
      new CustomZodValidationPipe(z.coerce.number().int().positive()),
    )
    id: number,
  ): Promise<{ message: string }> {
    return this.adminQnaService.deleteAnswer(id);
  }
}



