import { Injectable } from '@nestjs/common';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { PaginationResultDto } from '@/common/dto/pagination-result.dto';
import { paginate } from '@/common/helper/paginate';
import { DoctorProfile, Period } from '@prisma/client';
import { PrismaService } from '@/common/prisma/prisma.service';
import { getTimeslotByDoctorIdAndDayResponseDto } from './dto/response';
import { DateUtil } from '@/common/utils';

@Injectable()
export class DoctorService {
  constructor(private readonly prismaService: PrismaService) {}

  async getDoctorServices(page: number, limit: number) {
    return paginate(this.prismaService.service, page, limit);
  }

  async getDoctorByServiceId(serviceId: number) {
    const doctor = await this.prismaService.doctorProfile.findMany({
      where: {
        services: {
          some: {
            serviceId,
          },
        },
      },
      include: {
        user: true,
      },
    });
    return doctor;
  }

  async getTimeslotByDoctorIdAndDay(
    doctorId: number,
  ): Promise<getTimeslotByDoctorIdAndDayResponseDto[]> {
    const doctors = await this.prismaService.doctorProfile.findFirstOrThrow({
      where: {
        id: doctorId,
      },
      include: {
        timeslots: true,
        specialTimeslots: {
          where: {
            day: {
              gte: new Date(),
            },
          },
        },
      },
    });

    return DateUtil.getNextNDays(3).map((day) => {
      const special = doctors.specialTimeslots.filter((spe) => spe.day === day);

      const morningSlot =
        special.find((s) => s.period === Period.MORNING)?.slot ??
        doctors.timeslots.find((s) => s.period === Period.MORNING)?.slot ??
        3;

      const afternoonSlot =
        special.find((s) => s.period === Period.AFTERNOON)?.slot ??
        doctors.timeslots.find((s) => s.period === Period.AFTERNOON)?.slot ??
        3;

      return {
        day,
        morningSlot,
        afternoonSlot,
      } as getTimeslotByDoctorIdAndDayResponseDto;
    });
  }
}
