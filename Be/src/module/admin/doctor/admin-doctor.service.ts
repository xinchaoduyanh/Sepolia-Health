import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import {
  CreateDoctorDto,
  UpdateDoctorDto,
  CreateDoctorResponseDto,
  DoctorListResponseDto,
  DoctorDetailResponseDto,
  CreateDoctorScheduleDto,
} from './admin-doctor.dto';

@Injectable()
export class AdminDoctorService {
  constructor(private readonly prisma: PrismaService) {}

  async createDoctor(
    createDoctorDto: CreateDoctorDto,
    adminId: number,
  ): Promise<CreateDoctorResponseDto> {
    const { email, password, ...doctorData } = createDoctorDto;

    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email đã được sử dụng');
    }

    // Create user and doctor profile
    const result = await this.prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email,
          password: password, // Store password as plain text
          role: 'DOCTOR',
        },
      });

      // Create doctor profile
      const doctorProfile = await tx.doctorProfile.create({
        data: {
          userId: user.id,
          firstName: doctorData.fullName.split(' ')[0] || '',
          lastName: doctorData.fullName.split(' ').slice(1).join(' ') || '',
          specialty: doctorData.specialty,
          experience: doctorData.experienceYears?.toString() || '',
          contactInfo: doctorData.phone,
        },
      });

      return { user, doctorProfile };
    });

    return {
      id: result.doctorProfile.id,
      email: result.user.email,
      fullName: `${result.doctorProfile.firstName} ${result.doctorProfile.lastName}`,
      specialty: result.doctorProfile.specialty,
      experienceYears: parseInt(result.doctorProfile.experience || '0'),
      status: 'ACTIVE',
    };
  }

  async getDoctors(
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Promise<DoctorListResponseDto> {
    const skip = (page - 1) * limit;

    const where = search
      ? {
          role: 'DOCTOR' as const,
          doctorProfile: {
            is: {
              OR: [
                {
                  firstName: { contains: search, mode: 'insensitive' as const },
                },
                {
                  lastName: { contains: search, mode: 'insensitive' as const },
                },
                {
                  specialty: { contains: search, mode: 'insensitive' as const },
                },
              ],
            },
          },
        }
      : { role: 'DOCTOR' as const };

    const [doctors, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          doctorProfile: true,
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
        specialty: doctor.doctorProfile!.specialty,
        experienceYears: parseInt(doctor.doctorProfile!.experience || '0'),
        status: 'ACTIVE',
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
      specialty: doctor.specialty,
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
    if (updateDoctorDto.specialty)
      updateData.specialty = updateDoctorDto.specialty;
    if (updateDoctorDto.experienceYears !== undefined)
      updateData.experience = updateDoctorDto.experienceYears.toString();
    if (updateDoctorDto.phone) updateData.contactInfo = updateDoctorDto.phone;

    const updatedDoctor = await this.prisma.doctorProfile.update({
      where: { id },
      data: updateData,
      include: { user: true },
    });

    return {
      id: updatedDoctor.id,
      email: updatedDoctor.user.email,
      fullName: `${updatedDoctor.firstName} ${updatedDoctor.lastName}`,
      specialty: updatedDoctor.specialty,
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
        dayOfWeek: createScheduleDto.dayOfWeek as any,
      },
    });

    if (existingSchedule) {
      throw new ConflictException('Lịch làm việc cho ngày này đã tồn tại');
    }

    // Create new schedule
    await this.prisma.doctorAvailability.create({
      data: {
        doctorId,
        dayOfWeek: createScheduleDto.dayOfWeek as any,
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
}
