import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { AppointmentStatus } from '@prisma/client';
import { CreateFeedbackDto, FeedbackResponseDto } from './feedback.dto';
import { ERROR_MESSAGES } from '@/common/constants';

@Injectable()
export class FeedbackService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tạo feedback cho appointment
   * Chỉ cho phép tạo feedback cho appointment đã hoàn thành
   * Mỗi appointment chỉ có thể có một feedback
   */
  async createFeedback(
    appointmentId: number,
    createFeedbackDto: CreateFeedbackDto,
    userId: number,
  ): Promise<FeedbackResponseDto> {
    // Kiểm tra appointment có tồn tại không
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patientProfile: {
          select: {
            managerId: true,
          },
        },
        feedback: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException(ERROR_MESSAGES.COMMON.RESOURCE_NOT_FOUND);
    }

    // Kiểm tra appointment thuộc về user hiện tại
    if (appointment.patientProfile.managerId !== userId) {
      throw new ForbiddenException(
        'Bạn không có quyền đánh giá appointment này',
      );
    }

    // Kiểm tra appointment đã hoàn thành chưa
    if (appointment.status !== AppointmentStatus.COMPLETED) {
      throw new BadRequestException(
        'Chỉ có thể đánh giá cho appointment đã hoàn thành',
      );
    }

    // Kiểm tra đã có feedback chưa
    if (appointment.feedback) {
      throw new ConflictException('Appointment này đã được đánh giá rồi');
    }

    // Tạo feedback
    const feedback = await this.prisma.feedback.create({
      data: {
        rating: createFeedbackDto.rating,
        comment: createFeedbackDto.comment || null,
        appointmentId: appointment.id,
      },
    });

    return {
      id: feedback.id,
      rating: feedback.rating,
      comment: feedback.comment || undefined,
      appointmentId: feedback.appointmentId,
      createdAt: feedback.createdAt,
    };
  }

  /**
   * Lấy feedback của appointment
   */
  async getFeedbackByAppointmentId(
    appointmentId: number,
    userId: number,
  ): Promise<FeedbackResponseDto | null> {
    // Kiểm tra appointment có tồn tại không
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patientProfile: {
          select: {
            managerId: true,
          },
        },
        feedback: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException(ERROR_MESSAGES.COMMON.RESOURCE_NOT_FOUND);
    }

    // Kiểm tra appointment thuộc về user hiện tại
    if (appointment.patientProfile.managerId !== userId) {
      throw new ForbiddenException(
        'Bạn không có quyền xem feedback của appointment này',
      );
    }

    if (!appointment.feedback) {
      return null;
    }

    return {
      id: appointment.feedback.id,
      rating: appointment.feedback.rating,
      comment: appointment.feedback.comment || undefined,
      appointmentId: appointment.feedback.appointmentId,
      createdAt: appointment.feedback.createdAt,
    };
  }
}
