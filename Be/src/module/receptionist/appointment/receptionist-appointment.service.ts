import { ERROR_MESSAGES } from '@/common/constants';
import { PrismaService } from '@/common/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { GetAppointmentDetailResponseDto } from './dto/response';

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
}
