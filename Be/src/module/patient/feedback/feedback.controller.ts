import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { FeedbackService } from './feedback.service';
import {
  CreateFeedbackDto,
  FeedbackResponseDto,
  CreateFeedbackSchema,
} from './feedback.dto';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import { Roles } from '@/common/decorators';
import { Role } from '@prisma/client';
import { CurrentUser } from '@/common/decorators';
import { CustomZodValidationPipe } from '@/common/pipes';

@ApiTags('Patient Feedback')
@Controller('patient/appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.PATIENT)
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post(':id/feedback')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo feedback/rating cho appointment' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID appointment' })
  @ApiResponse({
    status: 201,
    description: 'Tạo feedback thành công',
    type: FeedbackResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Appointment chưa hoàn thành hoặc dữ liệu không hợp lệ',
  })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền đánh giá appointment này',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy appointment',
  })
  @ApiResponse({
    status: 409,
    description: 'Appointment này đã được đánh giá rồi',
  })
  async createFeedback(
    @Param('id', ParseIntPipe) appointmentId: number,
    @Body(new CustomZodValidationPipe(CreateFeedbackSchema))
    createFeedbackDto: CreateFeedbackDto,
    @CurrentUser('userId') userId: number,
  ): Promise<FeedbackResponseDto> {
    return this.feedbackService.createFeedback(
      appointmentId,
      createFeedbackDto,
      userId,
    );
  }

  @Get(':id/feedback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy feedback của appointment' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID appointment' })
  @ApiResponse({
    status: 200,
    description: 'Lấy feedback thành công',
    type: FeedbackResponseDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Không có feedback',
    schema: {
      type: 'null',
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền xem feedback của appointment này',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy appointment',
  })
  async getFeedback(
    @Param('id', ParseIntPipe) appointmentId: number,
    @CurrentUser('userId') userId: number,
  ): Promise<FeedbackResponseDto | null> {
    return this.feedbackService.getFeedbackByAppointmentId(
      appointmentId,
      userId,
    );
  }
}
