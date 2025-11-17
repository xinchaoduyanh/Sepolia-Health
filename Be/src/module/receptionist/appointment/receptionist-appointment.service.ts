import { ERROR_MESSAGES } from '@/common/constants';
import { PrismaService } from '@/common/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { GetAppointmentDetailResponseDto } from './dto/response';
import { SuccessResponseDto } from '@/common/dto';
import { AppointmentDetailResponseDto } from '@/module/patient/appointment/dto';

@Injectable()
export class ReceptionistAppointmentService {
  constructor(private readonly prisma: PrismaService) {}

  async getAppointmentDetail(
    id: number,
  ): Promise<AppointmentDetailResponseDto> {
    const appointment = await this.prisma.appointment.findFirstOrThrow({
      where: { id },
      include: {
        patientProfile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            managerId: true, // Cần managerId để gửi notification
          },
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        service: true,
        billing: {
          select: {
            id: true,
            amount: true,
            status: true,
            paymentMethod: true,
            notes: true,
            createdAt: true,
          },
        },
        clinic: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException(ERROR_MESSAGES.COMMON.RESOURCE_NOT_FOUND);
    }

    return appointment;
  }

  async checkInAppointment(id: number): Promise<SuccessResponseDto> {
    await this.prisma.appointment.update({
      where: { id },
      data: { status: 'ON_GOING' },
    });

    return new SuccessResponseDto();
  }
}
