import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
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
  ApiBody,
} from '@nestjs/swagger';
import { QnaService } from './qna.service';
import {
  CreateQuestionDto,
  UpdateQuestionDto,
  CreateAnswerDto,
  UpdateAnswerDto,
  VoteDto,
  SetBestAnswerDto,
  GetQuestionsQueryDto,
  CreateQuestionDtoClass,
  UpdateQuestionDtoClass,
  CreateAnswerDtoClass,
  UpdateAnswerDtoClass,
  VoteDtoClass,
  SetBestAnswerDtoClass,
  GetQuestionsQueryDtoClass,
  CreateQuestionSchema,
  UpdateQuestionSchema,
  CreateAnswerSchema,
  UpdateAnswerSchema,
  VoteSchema,
  SetBestAnswerSchema,
  GetQuestionsQuerySchema,
  QuestionDetailResponseDto,
  QuestionsListResponseDto,
  CreateQuestionResponseDto,
  UpdateQuestionResponseDto,
  AnswersListResponseDto,
  CreateAnswerResponseDto,
  UpdateAnswerResponseDto,
  TagsListResponseDto,
  EditHistoryItemDto,
} from './qna.dto';
import { JwtAuthGuard } from '@/common/guards';
import { CurrentUser } from '@/common/decorators';
import { CustomZodValidationPipe } from '@/common/pipes';
import { z } from 'zod';

@ApiTags('Q&A Community')
@Controller('qna')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class QnaController {
  constructor(private readonly qnaService: QnaService) {}

  // ========== QUESTION ENDPOINTS ==========

  @Post('questions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo câu hỏi mới' })
  @ApiBody({ type: CreateQuestionDtoClass })
  @ApiResponse({
    status: 201,
    description: 'Tạo câu hỏi thành công',
    type: CreateQuestionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  async createQuestion(
    @Body(new CustomZodValidationPipe(CreateQuestionSchema))
    createQuestionDto: CreateQuestionDto,
    @CurrentUser('userId') userId: number,
  ): Promise<CreateQuestionResponseDto> {
    return this.qnaService.createQuestion(createQuestionDto, userId);
  }

  @Get('questions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy danh sách câu hỏi' })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách câu hỏi thành công',
    type: QuestionsListResponseDto,
  })
  async getQuestions(
    @Query(new CustomZodValidationPipe(GetQuestionsQuerySchema))
    query: GetQuestionsQueryDto,
  ): Promise<QuestionsListResponseDto> {
    return this.qnaService.getQuestions(query);
  }

  @Get('questions/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy chi tiết câu hỏi' })
  @ApiParam({
    name: 'id',
    description: 'ID của câu hỏi',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy chi tiết câu hỏi thành công',
    type: QuestionDetailResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Câu hỏi không tồn tại' })
  async getQuestionById(
    @Param(
      'id',
      new CustomZodValidationPipe(z.coerce.number().int().positive()),
    )
    id: number,
    @CurrentUser('userId') userId?: number,
  ): Promise<QuestionDetailResponseDto> {
    return this.qnaService.getQuestionById(id, userId);
  }

  @Put('questions/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cập nhật câu hỏi' })
  @ApiParam({
    name: 'id',
    description: 'ID của câu hỏi',
    type: Number,
    example: 1,
  })
  @ApiBody({ type: UpdateQuestionDtoClass })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật câu hỏi thành công',
    type: UpdateQuestionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Câu hỏi không tồn tại' })
  @ApiResponse({ status: 403, description: 'Không có quyền chỉnh sửa' })
  async updateQuestion(
    @Param(
      'id',
      new CustomZodValidationPipe(z.coerce.number().int().positive()),
    )
    id: number,
    @Body(new CustomZodValidationPipe(UpdateQuestionSchema))
    updateQuestionDto: UpdateQuestionDto,
    @CurrentUser('userId') userId: number,
  ): Promise<UpdateQuestionResponseDto> {
    return this.qnaService.updateQuestion(id, updateQuestionDto, userId);
  }

  @Delete('questions/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa câu hỏi' })
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
  @ApiResponse({ status: 403, description: 'Không có quyền xóa' })
  async deleteQuestion(
    @Param(
      'id',
      new CustomZodValidationPipe(z.coerce.number().int().positive()),
    )
    id: number,
    @CurrentUser('userId') userId: number,
  ): Promise<{ message: string }> {
    return this.qnaService.deleteQuestion(id, userId);
  }

  @Post('questions/:id/vote')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Vote câu hỏi' })
  @ApiParam({
    name: 'id',
    description: 'ID của câu hỏi',
    type: Number,
    example: 1,
  })
  @ApiBody({ type: VoteDtoClass })
  @ApiResponse({
    status: 200,
    description: 'Vote thành công',
  })
  async voteQuestion(
    @Param(
      'id',
      new CustomZodValidationPipe(z.coerce.number().int().positive()),
    )
    id: number,
    @Body(new CustomZodValidationPipe(VoteSchema))
    voteDto: VoteDto,
    @CurrentUser('userId') userId: number,
  ): Promise<{ message: string; upvotes: number; downvotes: number }> {
    return this.qnaService.voteQuestion(id, voteDto, userId);
  }

  @Put('questions/:id/best-answer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Chọn best answer cho câu hỏi' })
  @ApiParam({
    name: 'id',
    description: 'ID của câu hỏi',
    type: Number,
    example: 1,
  })
  @ApiBody({ type: SetBestAnswerDtoClass })
  @ApiResponse({
    status: 200,
    description: 'Chọn best answer thành công',
  })
  @ApiResponse({ status: 403, description: 'Chỉ người hỏi mới có quyền' })
  async setBestAnswer(
    @Param(
      'id',
      new CustomZodValidationPipe(z.coerce.number().int().positive()),
    )
    questionId: number,
    @Body(new CustomZodValidationPipe(SetBestAnswerSchema))
    setBestAnswerDto: SetBestAnswerDto,
    @CurrentUser('userId') userId: number,
  ): Promise<{ message: string }> {
    return this.qnaService.setBestAnswer(questionId, setBestAnswerDto, userId);
  }

  @Get('questions/:id/edit-history')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy lịch sử chỉnh sửa câu hỏi' })
  @ApiParam({
    name: 'id',
    description: 'ID của câu hỏi',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy lịch sử chỉnh sửa thành công',
    type: [EditHistoryItemDto],
  })
  async getQuestionEditHistory(
    @Param(
      'id',
      new CustomZodValidationPipe(z.coerce.number().int().positive()),
    )
    questionId: number,
  ): Promise<EditHistoryItemDto[]> {
    return this.qnaService.getQuestionEditHistory(questionId);
  }

  // ========== ANSWER ENDPOINTS ==========

  @Post('questions/:questionId/answers')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo câu trả lời' })
  @ApiParam({
    name: 'questionId',
    description: 'ID của câu hỏi',
    type: Number,
    example: 1,
  })
  @ApiBody({ type: CreateAnswerDtoClass })
  @ApiResponse({
    status: 201,
    description: 'Tạo câu trả lời thành công',
    type: CreateAnswerResponseDto,
  })
  async createAnswer(
    @Param(
      'questionId',
      new CustomZodValidationPipe(z.coerce.number().int().positive()),
    )
    questionId: number,
    @Body(new CustomZodValidationPipe(CreateAnswerSchema))
    createAnswerDto: CreateAnswerDto,
    @CurrentUser('userId') userId: number,
  ): Promise<CreateAnswerResponseDto> {
    return this.qnaService.createAnswer(questionId, createAnswerDto, userId);
  }

  @Get('questions/:questionId/answers')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy danh sách câu trả lời của câu hỏi' })
  @ApiParam({
    name: 'questionId',
    description: 'ID của câu hỏi',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách câu trả lời thành công',
    type: AnswersListResponseDto,
  })
  async getAnswers(
    @Param(
      'questionId',
      new CustomZodValidationPipe(z.coerce.number().int().positive()),
    )
    questionId: number,
  ): Promise<AnswersListResponseDto> {
    return this.qnaService.getAnswers(questionId);
  }

  @Put('answers/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cập nhật câu trả lời' })
  @ApiParam({
    name: 'id',
    description: 'ID của câu trả lời',
    type: Number,
    example: 1,
  })
  @ApiBody({ type: UpdateAnswerDtoClass })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật câu trả lời thành công',
    type: UpdateAnswerResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Câu trả lời không tồn tại' })
  @ApiResponse({ status: 403, description: 'Không có quyền chỉnh sửa' })
  async updateAnswer(
    @Param(
      'id',
      new CustomZodValidationPipe(z.coerce.number().int().positive()),
    )
    id: number,
    @Body(new CustomZodValidationPipe(UpdateAnswerSchema))
    updateAnswerDto: UpdateAnswerDto,
    @CurrentUser('userId') userId: number,
  ): Promise<UpdateAnswerResponseDto> {
    return this.qnaService.updateAnswer(id, updateAnswerDto, userId);
  }

  @Delete('answers/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa câu trả lời' })
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
  @ApiResponse({ status: 403, description: 'Không có quyền xóa' })
  async deleteAnswer(
    @Param(
      'id',
      new CustomZodValidationPipe(z.coerce.number().int().positive()),
    )
    id: number,
    @CurrentUser('userId') userId: number,
  ): Promise<{ message: string }> {
    return this.qnaService.deleteAnswer(id, userId);
  }

  @Post('answers/:id/vote')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Vote câu trả lời' })
  @ApiParam({
    name: 'id',
    description: 'ID của câu trả lời',
    type: Number,
    example: 1,
  })
  @ApiBody({ type: VoteDtoClass })
  @ApiResponse({
    status: 200,
    description: 'Vote thành công',
  })
  async voteAnswer(
    @Param(
      'id',
      new CustomZodValidationPipe(z.coerce.number().int().positive()),
    )
    id: number,
    @Body(new CustomZodValidationPipe(VoteSchema))
    voteDto: VoteDto,
    @CurrentUser('userId') userId: number,
  ): Promise<{ message: string; upvotes: number; downvotes: number }> {
    return this.qnaService.voteAnswer(id, voteDto, userId);
  }

  @Get('answers/:id/edit-history')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy lịch sử chỉnh sửa câu trả lời' })
  @ApiParam({
    name: 'id',
    description: 'ID của câu trả lời',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy lịch sử chỉnh sửa thành công',
    type: [EditHistoryItemDto],
  })
  async getAnswerEditHistory(
    @Param(
      'id',
      new CustomZodValidationPipe(z.coerce.number().int().positive()),
    )
    answerId: number,
  ): Promise<EditHistoryItemDto[]> {
    return this.qnaService.getAnswerEditHistory(answerId);
  }

  // ========== TAG ENDPOINTS ==========

  @Get('tags')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy danh sách tất cả tags' })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách tags thành công',
    type: TagsListResponseDto,
  })
  async getTags(): Promise<TagsListResponseDto> {
    return this.qnaService.getTags();
  }

  @Get('tags/popular')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy danh sách tags phổ biến' })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách tags phổ biến thành công',
    type: TagsListResponseDto,
  })
  async getPopularTags(): Promise<TagsListResponseDto> {
    return this.qnaService.getPopularTags(10);
  }
}


