import { PrismaService } from '@/common/prisma/prisma.service';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role, UserStatus } from '@prisma/client';
import {
  CreateDoctorDto,
  CreateDoctorResponseDto,
  CreateDoctorScheduleDto,
  DoctorDetailResponseDto,
  DoctorListResponseDto,
  GetDoctorsQueryDto,
  UpdateDoctorDto,
  UpdateDoctorStatusDto,
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

    // Validate specialties
    const uniqueSpecialtyIds = Array.from(new Set(doctorData.specialtyIds));
    const specialties = await this.prisma.specialty.findMany({
      where: { id: { in: uniqueSpecialtyIds } },
      select: { id: true },
    });
    if (specialties.length !== uniqueSpecialtyIds.length) {
      throw new NotFoundException('Một hoặc nhiều chuyên khoa không tồn tại');
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

      // Create doctor specialties
      if (uniqueSpecialtyIds.length > 0) {
        await tx.doctorSpecialty.createMany({
          data: uniqueSpecialtyIds.map((specialtyId) => ({
            doctorId: doctorProfile.id,
            specialtyId,
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

    // Get services and specialties for the doctor
    const [doctorServices, doctorSpecialties] = await Promise.all([
      this.prisma.doctorService.findMany({
        where: { doctorId: result.doctorProfile.id },
        include: {
          service: {
            select: {
              name: true,
            },
          },
        },
      }),
      this.prisma.doctorSpecialty.findMany({
        where: { doctorId: result.doctorProfile.id },
        include: {
          specialty: {
            select: {
              id: true,
              name: true,
              description: true,
              icon: true,
            },
          },
        },
      }),
    ]);

    return {
      id: result.doctorProfile.id,
      email: result.user.email,
      fullName: `${result.doctorProfile.lastName} ${result.doctorProfile.firstName}`,
      phone: result.user.phone || '',
      services: doctorServices.map((s) => s.service.name),
      specialties: doctorSpecialties.map((ds) => ({
        id: ds.specialty.id,
        name: ds.specialty.name,
        description: ds.specialty.description || undefined,
        icon: ds.specialty.icon || undefined,
      })),
      experienceYears: parseInt(result.doctorProfile.experience || '0'),
      status: result.user.status,
      createdAt: result.doctorProfile.createdAt,
      avatar: result.doctorProfile.avatar,
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
            where: { deletedAt: null },
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
              specialties: {
                include: {
                  specialty: {
                    select: {
                      id: true,
                      name: true,
                      description: true,
                      icon: true,
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

    // Filter out users that don't have doctorProfile
    const validDoctors = doctors.filter(
      (doctor) => doctor.doctorProfile !== null,
    );

    return {
      doctors: validDoctors.map((doctor) => ({
        id: doctor.doctorProfile!.id,
        email: doctor.email,
        fullName: `${doctor.doctorProfile!.lastName} ${doctor.doctorProfile!.firstName}`,
        phone: doctor.phone || '',
        services: doctor.doctorProfile!.services.map((s) => s.service.name),
        specialties: doctor.doctorProfile!.specialties.map((ds) => ({
          id: ds.specialty.id,
          name: ds.specialty.name,
          description: ds.specialty.description || undefined,
          icon: ds.specialty.icon || undefined,
        })),
        experienceYears: parseInt(doctor.doctorProfile!.experience || '0'),
        status: doctor.status,
        clinic: doctor.doctorProfile!.clinic
          ? {
              id: doctor.doctorProfile!.clinic.id,
              name: doctor.doctorProfile!.clinic.name,
            }
          : null,
        createdAt: doctor.createdAt,
        avatar: doctor.doctorProfile!.avatar,
      })),
      total,
      page,
      limit,
    };
  }

  async getDoctorById(id: number): Promise<DoctorDetailResponseDto> {
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id, deletedAt: null },
      include: {
        user: true,
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
                id: true,
                name: true,
                price: true,
                duration: true,
                description: true,
              },
            },
          },
        },
        specialties: {
          include: {
            specialty: {
              select: {
                id: true,
                name: true,
                description: true,
                icon: true,
              },
            },
          },
        },
        appointments: {
          select: {
            status: true,
          },
        },
      },
    });

    if (!doctor) {
      throw new NotFoundException('Không tìm thấy bác sĩ');
    }

    // Tính toán thống kê appointments
    const appointmentStats = {
      total: doctor.appointments.length,
      completed: doctor.appointments.filter((a) => a.status === 'COMPLETED')
        .length,
      cancelled: doctor.appointments.filter((a) => a.status === 'CANCELLED')
        .length,
      upcoming: doctor.appointments.filter((a) => a.status === 'UPCOMING')
        .length,
      onGoing: doctor.appointments.filter((a) => a.status === 'ON_GOING')
        .length,
    };

    return {
      id: doctor.id,
      email: doctor.user.email,
      fullName: `${doctor.lastName} ${doctor.firstName}`,
      avatar: doctor.avatar,
      phone: doctor.user.phone || '',
      services: doctor.services.map((s) => ({
        id: s.service.id,
        name: s.service.name,
        price: s.service.price,
        duration: s.service.duration,
        description: s.service.description || undefined,
      })),
      specialties: doctor.specialties.map((ds) => ({
        id: ds.specialty.id,
        name: ds.specialty.name,
        description: ds.specialty.description || undefined,
        icon: ds.specialty.icon || undefined,
      })),
      appointmentStats,
      experienceYears: parseInt(doctor.experience || '0'),
      description: doctor.contactInfo || undefined,
      address: doctor.contactInfo || '',
      status: doctor.user.status,
      clinic: doctor.clinic
        ? {
            id: doctor.clinic.id,
            name: doctor.clinic.name,
          }
        : null,
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

    // Validate specialties if updating
    if (updateDoctorDto.specialtyIds) {
      const uniqueSpecialtyIds = Array.from(
        new Set(updateDoctorDto.specialtyIds),
      );
      const specialties = await this.prisma.specialty.findMany({
        where: { id: { in: uniqueSpecialtyIds } },
        select: { id: true },
      });
      if (specialties.length !== uniqueSpecialtyIds.length) {
        throw new NotFoundException('Một hoặc nhiều chuyên khoa không tồn tại');
      }
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

    const updatedDoctor = await this.prisma.$transaction(async (tx) => {
      // Update doctor profile
      const doctor = await tx.doctorProfile.update({
        where: { id },
        data: updateData,
        include: {
          user: true,
        },
      });

      // Update specialties if provided
      if (updateDoctorDto.specialtyIds) {
        const uniqueSpecialtyIds = Array.from(
          new Set(updateDoctorDto.specialtyIds),
        );
        // Delete existing specialties
        await tx.doctorSpecialty.deleteMany({
          where: { doctorId: id },
        });
        // Create new specialties
        if (uniqueSpecialtyIds.length > 0) {
          await tx.doctorSpecialty.createMany({
            data: uniqueSpecialtyIds.map((specialtyId) => ({
              doctorId: id,
              specialtyId,
            })),
            skipDuplicates: true,
          });
        }
      }

      return doctor;
    });

    // Get updated services and specialties
    const [doctorServices, doctorSpecialties] = await Promise.all([
      this.prisma.doctorService.findMany({
        where: { doctorId: id },
        include: {
          service: {
            select: {
              name: true,
            },
          },
        },
      }),
      this.prisma.doctorSpecialty.findMany({
        where: { doctorId: id },
        include: {
          specialty: {
            select: {
              id: true,
              name: true,
              description: true,
              icon: true,
            },
          },
        },
      }),
    ]);

    return {
      id: updatedDoctor.id,
      email: updatedDoctor.user.email,
      fullName: `${updatedDoctor.lastName} ${updatedDoctor.firstName}`,
      services: doctorServices.map((s) => s.service.name),
      specialties: doctorSpecialties.map((ds) => ({
        id: ds.specialty.id,
        name: ds.specialty.name,
        description: ds.specialty.description || undefined,
        icon: ds.specialty.icon || undefined,
      })),
      experienceYears: parseInt(updatedDoctor.experience || '0'),
      status: 'ACTIVE',
      avatar: updatedDoctor.avatar,
    };
  }

  async updateDoctorStatus(
    id: number,
    updateStatusDto: UpdateDoctorStatusDto,
  ): Promise<CreateDoctorResponseDto> {
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id, deletedAt: null },
      include: { user: true },
    });

    if (!doctor) {
      throw new NotFoundException('Không tìm thấy bác sĩ');
    }

    // Update user status
    await this.prisma.user.update({
      where: { id: doctor.userId },
      data: { status: updateStatusDto.status },
    });

    // Get updated doctor data
    const updatedDoctor = await this.prisma.doctorProfile.findUnique({
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
        specialties: {
          include: {
            specialty: {
              select: {
                id: true,
                name: true,
                description: true,
                icon: true,
              },
            },
          },
        },
      },
    });

    if (!updatedDoctor) {
      throw new NotFoundException('Không tìm thấy bác sĩ sau khi cập nhật');
    }

    return {
      id: updatedDoctor.id,
      email: updatedDoctor.user.email,
      fullName: `${updatedDoctor.lastName} ${updatedDoctor.firstName}`,
      services: updatedDoctor.services.map((s) => s.service.name),
      specialties: updatedDoctor.specialties.map((ds) => ({
        id: ds.specialty.id,
        name: ds.specialty.name,
        description: ds.specialty.description || undefined,
        icon: ds.specialty.icon || undefined,
      })),
      experienceYears: parseInt(updatedDoctor.experience || '0'),
      status: updatedDoctor.user.status,
      avatar: updatedDoctor.avatar,
    };
  }

  async deleteDoctor(id: number): Promise<{ message: string }> {
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id, deletedAt: null },
      include: { user: true },
    });

    if (!doctor) {
      throw new NotFoundException('Không tìm thấy bác sĩ');
    }

    // Soft delete: Update deleted_at instead of hard delete
    await this.prisma.doctorProfile.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
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
      where: { id: doctorId, deletedAt: null },
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
      doctorName: `${doctor.lastName} ${doctor.firstName}`,
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
