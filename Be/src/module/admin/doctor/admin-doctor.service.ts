import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { UserStatus, Role } from '@prisma/client';
import {
  CreateDoctorDto,
  UpdateDoctorDto,
  CreateDoctorResponseDto,
  DoctorListResponseDto,
  DoctorDetailResponseDto,
  CreateDoctorScheduleDto,
  GetDoctorsQueryDto,
} from './admin-doctor.dto';

@Injectable()
export class AdminDoctorService {
  constructor(private readonly prisma: PrismaService) {}

  async createDoctor(
    createDoctorDto: CreateDoctorDto,
  ): Promise<CreateDoctorResponseDto> {
    const { email, password, ...doctorData } = createDoctorDto;

    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email đã được sử dụng');
    }

    // Validate clinic
    const clinic = await this.prisma.clinic.findUnique({
      where: { id: doctorData.clinicId },
    });

    if (!clinic || !clinic.isActive) {
      throw new NotFoundException(
        'Phòng khám không tồn tại hoặc không hoạt động',
      );
    }

    // Validate services
    const uniqueServiceIds = Array.from(new Set(doctorData.serviceIds));
    const services = await this.prisma.service.findMany({
      where: { id: { in: uniqueServiceIds } },
      select: { id: true },
    });
    if (services.length !== uniqueServiceIds.length) {
      throw new NotFoundException('Một hoặc nhiều dịch vụ không tồn tại');
    }

    // Create user and doctor profile + relations
    const result = await this.prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email,
          password: password, // Store password as plain text
          role: Role.DOCTOR,
          status: UserStatus.ACTIVE,
        },
      });

      // Create doctor profile
      const doctorProfile = await tx.doctorProfile.create({
        data: {
          userId: user.id,
          firstName: doctorData.fullName.split(' ')[0] || '',
          lastName: doctorData.fullName.split(' ').slice(1).join(' ') || '',
          experience: doctorData.experienceYears?.toString() || '',
          contactInfo: doctorData.phone,
          clinicId: doctorData.clinicId,
        },
      });

      // Create doctor services
      if (uniqueServiceIds.length > 0) {
        await tx.doctorService.createMany({
          data: uniqueServiceIds.map((serviceId) => ({
            doctorId: doctorProfile.id,
            serviceId,
          })),
          skipDuplicates: true,
        });
      }

      // Create weekly availabilities (optional)
      if (doctorData.availabilities && doctorData.availabilities.length > 0) {
        await tx.doctorAvailability.createMany({
          data: doctorData.availabilities.map((a) => ({
            doctorId: doctorProfile.id,
            dayOfWeek: a.dayOfWeek,
            startTime: a.startTime,
            endTime: a.endTime,
          })),
          skipDuplicates: true,
        });
      }

      return { user, doctorProfile };
    });

    // Get services for the doctor
    const doctorServices = await this.prisma.doctorService.findMany({
      where: { doctorId: result.doctorProfile.id },
      include: {
        service: {
          select: {
            name: true,
          },
        },
      },
    });

    return {
      id: result.doctorProfile.id,
      email: result.user.email,
      fullName: `${result.doctorProfile.firstName} ${result.doctorProfile.lastName}`,
      phone: result.user.phone || '',
      services: doctorServices.map((s) => s.service.name),
      experienceYears: parseInt(result.doctorProfile.experience || '0'),
      status: result.user.status,
      createdAt: result.doctorProfile.createdAt,
    };
  }

  async getDoctors(query: GetDoctorsQueryDto): Promise<DoctorListResponseDto> {
    const { page = 1, limit = 10, search, clinicId, serviceId } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      role: 'DOCTOR' as const,
    };

    // Search filter
    if (search) {
      where.doctorProfile = {
        is: {
          OR: [
            {
              firstName: { contains: search, mode: 'insensitive' as const },
            },
            {
              lastName: { contains: search, mode: 'insensitive' as const },
            },
          ],
        },
      };
    }

    // Clinic filter
    if (clinicId) {
      where.doctorProfile = {
        ...(where.doctorProfile || {}),
        is: {
          ...(where.doctorProfile?.is || {}),
          clinicId,
        },
      };
    }

    // Service filter
    if (serviceId) {
      where.doctorProfile = {
        ...(where.doctorProfile || {}),
        is: {
          ...(where.doctorProfile?.is || {}),
          services: {
            some: {
              serviceId,
            },
          },
        },
      };
    }

    const [doctors, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          doctorProfile: {
            include: {
              clinic: {
                select: {
                  id: true,
                  name: true,
                },
              },
              services: {
                include: {
                  service: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      doctors: doctors.map((doctor) => ({
        id: doctor.doctorProfile!.id,
        email: doctor.email,
        fullName: `${doctor.doctorProfile!.firstName} ${doctor.doctorProfile!.lastName}`,
        phone: doctor.phone || '',
        services: doctor.doctorProfile!.services.map((s) => s.service.name),
        experienceYears: parseInt(doctor.doctorProfile!.experience || '0'),
        status: doctor.status,
        clinic: doctor.doctorProfile!.clinic
          ? {
              id: doctor.doctorProfile!.clinic.id,
              name: doctor.doctorProfile!.clinic.name,
            }
          : null,
        createdAt: doctor.createdAt,
      })),
      total,
      page,
      limit,
    };
  }

  async getDoctorById(id: number): Promise<DoctorDetailResponseDto> {
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id },
      include: {
        user: true,
        services: {
          include: {
            service: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!doctor) {
      throw new NotFoundException('Không tìm thấy bác sĩ');
    }

    return {
      id: doctor.id,
      email: doctor.user.email,
      fullName: `${doctor.firstName} ${doctor.lastName}`,
      phone: doctor.user.phone || '',
      services: doctor.services.map((s) => s.service.name),
      experienceYears: parseInt(doctor.experience || '0'),
      description: doctor.contactInfo || undefined,
      address: doctor.contactInfo || '',
      createdAt: doctor.createdAt,
      updatedAt: doctor.updatedAt,
    } as DoctorDetailResponseDto;
  }

  async updateDoctor(
    id: number,
    updateDoctorDto: UpdateDoctorDto,
  ): Promise<CreateDoctorResponseDto> {
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!doctor) {
      throw new NotFoundException('Không tìm thấy bác sĩ');
    }

    // Prepare update data based on the DTO
    const updateData: any = {};
    if (updateDoctorDto.fullName) {
      const nameParts = updateDoctorDto.fullName.split(' ');
      updateData.firstName = nameParts[0];
      updateData.lastName = nameParts.slice(1).join(' ');
    }
    if (updateDoctorDto.experienceYears !== undefined)
      updateData.experience = updateDoctorDto.experienceYears.toString();
    if (updateDoctorDto.phone) updateData.contactInfo = updateDoctorDto.phone;

    const updatedDoctor = await this.prisma.doctorProfile.update({
      where: { id },
      data: updateData,
      include: {
        user: true,
        services: {
          include: {
            service: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return {
      id: updatedDoctor.id,
      email: updatedDoctor.user.email,
      fullName: `${updatedDoctor.firstName} ${updatedDoctor.lastName}`,
      services: updatedDoctor.services.map((s) => s.service.name),
      experienceYears: parseInt(updatedDoctor.experience || '0'),
      status: 'ACTIVE',
    };
  }

  async deleteDoctor(id: number): Promise<{ message: string }> {
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!doctor) {
      throw new NotFoundException('Không tìm thấy bác sĩ');
    }

    await this.prisma.$transaction(async (tx) => {
      // Delete doctor profile
      await tx.doctorProfile.delete({
        where: { id },
      });

      // Delete user
      await tx.user.delete({
        where: { id: doctor.userId },
      });
    });

    return { message: 'Xóa bác sĩ thành công' };
  }

  async createDoctorSchedule(
    doctorId: number,
    createScheduleDto: CreateDoctorScheduleDto,
  ): Promise<{ message: string }> {
    // Check if doctor exists
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id: doctorId },
    });

    if (!doctor) {
      throw new NotFoundException('Không tìm thấy bác sĩ');
    }

    // Check if schedule already exists for this day
    const existingSchedule = await this.prisma.doctorAvailability.findFirst({
      where: {
        doctorId,
        dayOfWeek: createScheduleDto.dayOfWeek,
      },
    });

    if (existingSchedule) {
      throw new ConflictException('Lịch làm việc cho ngày này đã tồn tại');
    }

    // Create new schedule
    await this.prisma.doctorAvailability.create({
      data: {
        doctorId,
        dayOfWeek: createScheduleDto.dayOfWeek,
        startTime: createScheduleDto.startTime,
        endTime: createScheduleDto.endTime,
      },
    });

    return { message: 'Tạo lịch làm việc thành công' };
  }

  async getDoctorSchedule(doctorId: number) {
    // Check if doctor exists
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id: doctorId },
    });

    if (!doctor) {
      throw new NotFoundException('Không tìm thấy bác sĩ');
    }

    const schedules = await this.prisma.doctorAvailability.findMany({
      where: { doctorId },
      orderBy: { dayOfWeek: 'asc' },
    });

    return {
      doctorId,
      doctorName: `${doctor.firstName} ${doctor.lastName}`,
      schedules: schedules.map((schedule) => ({
        id: schedule.id,
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
      })),
    };
  }

  async getClinics() {
    const clinics = await this.prisma.clinic.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        email: true,
        description: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return clinics;
  }

  async getServices() {
    const services = await this.prisma.service.findMany({
      select: {
        id: true,
        name: true,
        price: true,
        duration: true,
        description: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return services;
  }
}
