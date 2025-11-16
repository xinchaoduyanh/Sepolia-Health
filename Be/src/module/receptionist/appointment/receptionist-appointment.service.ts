import { ERROR_MESSAGES } from '@/common/constants';
import { PrismaService } from '@/common/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { GetAppointmentDetailResponseDto } from './dto/response';
import { SuccessResponseDto } from '@/common/dto';

@Injectable()
export class ReceptionistAppointmentService {
  constructor(private readonly prisma: PrismaService) {}

  async getAppointmentDetail(
    id: number,
  ): Promise<GetAppointmentDetailResponseDto> {
    const appointment = await this.prisma.appointment.findFirstOrThrow({
      where: { id },
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
