import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginationResultDto } from '@/common/dto/pagination-result.dto';
import { paginate } from '@/common/helper/paginate';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/common/prisma/prisma.service';
import {
  GetDoctorServiceResponseDto,
  getTimeslotByDoctorIdAndDayResponseDto,
} from './dto/response';
import { DateUtil } from '@/common/utils';
import {
  CreateDoctorProfileBodyDto,
  GetDoctorServiceQueryDto,
  updateDoctorProfileBodyDto,
} from './dto/request';
import { SuccessResponseDto } from '@/common/dto';
import {
  CreateDoctorProfileResponseDto,
  GetDoctorProfileByServiceIdResponseDto,
} from './dto/response/doctor-profile.dto';
import { ERROR_MESSAGES } from '@/common/constants/error-messages';

@Injectable()
export class DoctorService {
  constructor(private readonly prismaService: PrismaService) {}

  async getDoctorServices(
    query: GetDoctorServiceQueryDto,
  ): Promise<PaginationResultDto<GetDoctorServiceResponseDto>> {
    return paginate(this.prismaService.service, query.page, query.limit);
  }

  async getDoctorByServiceId(
    serviceId: number,
  ): Promise<GetDoctorProfileByServiceIdResponseDto[]> {
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
        availabilities: true,
        overrides: {
          where: {
            date: {
              gte: new Date(),
            },
          },
        },
      },
    });

    return DateUtil.getNextNDays(3).map((day) => {
      const dayOfWeek = day.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const dayName = [
        'SUNDAY',
        'MONDAY',
        'TUESDAY',
        'WEDNESDAY',
        'THURSDAY',
        'FRIDAY',
        'SATURDAY',
      ][dayOfWeek];

      // Check for override first
      const override = doctors.overrides.find(
        (o) => o.date.toDateString() === day.toDateString(),
      );

      // Get regular availability for this day of week
      const availability = doctors.availabilities.find(
        (a) => a.dayOfWeek === dayName,
      );

      // Default to 3 slots if no availability found
      const morningSlot = 3;
      const afternoonSlot = 3;

      return {
        day,
        morningSlot,
        afternoonSlot,
      } as getTimeslotByDoctorIdAndDayResponseDto;
    });
  }

  // missing validation
  async createDoctorProfile(
    body: CreateDoctorProfileBodyDto,
    userId: number,
  ): Promise<CreateDoctorProfileResponseDto> {
    const doctor = await this.prismaService.doctorProfile.findFirst({
      where: {
        userId,
      },
    });

    if (doctor) {
      throw new ConflictException(ERROR_MESSAGES.DOCTOR.DOCTOR_ALREADY_EXIST);
    }

    return this.prismaService.doctorProfile.create({
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        specialty: body.specialty,
        experience: body.experience,
        contactInfo: body.contactInfo,
        userId,
        services: {
          create: body.serviceIds.map((id) => ({
            service: { connect: { id } },
          })),
        },
      },
    });
  }

  async updateDoctorProfile(
    body: updateDoctorProfileBodyDto,
    userId: number,
  ): Promise<SuccessResponseDto> {
    const doctor = await this.prismaService.doctorProfile.findFirst({
      where: {
        userId,
      },
      include: {
        services: true,
      },
    });
    if (!doctor) {
      throw new NotFoundException(ERROR_MESSAGES.COMMON.RESOURCE_NOT_FOUND);
    }
    const {
      firstName,
      lastName,
      specialty,
      experience,
      contactInfo,
      serviceIds,
    } = body;
    const data: Prisma.DoctorProfileUpdateInput = {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(specialty && { specialty }),
      ...(experience && { experience }),
      ...(contactInfo && { contactInfo }),
    };
    //update doctor
    await this.prismaService.doctorProfile.update({
      where: { id: doctor.id },
      data,
    });

    //update doctor service
    if (serviceIds) {
      await this.prismaService.doctorService.deleteMany({
        where: {
          id: { in: doctor.services.map((s) => s.id) },
        },
      });
      if (serviceIds.length) {
        await this.prismaService.doctorService.createMany({
          data: serviceIds.map((id) => ({
            doctorId: doctor.id,
            serviceId: id,
          })),
        });
      }
    }
    return new SuccessResponseDto();
  }
}
