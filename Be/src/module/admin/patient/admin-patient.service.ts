import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import {
  CreatePatientDto,
  UpdatePatientDto,
  CreatePatientResponseDto,
  PatientListResponseDto,
  PatientDetailResponseDto,
} from './admin-patient.dto';

@Injectable()
export class AdminPatientService {
  constructor(private readonly prisma: PrismaService) {}

  async createPatient(
    createPatientDto: CreatePatientDto,
    adminId: number,
  ): Promise<CreatePatientResponseDto> {
    const { email, password, ...patientData } = createPatientDto;

    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email đã được sử dụng');
    }

    // Create user and patient profile
    const result = await this.prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email,
          password: password, // Store password as plain text
          role: 'PATIENT',
        },
      });

      // Create patient profile
      const patientProfile = await tx.patientProfile.create({
        data: {
          managerId: user.id, // Patient manages their own profile
          firstName: patientData.fullName.split(' ')[0],
          lastName: patientData.fullName.split(' ').slice(1).join(' '),
          phone: patientData.phone,
          dateOfBirth: new Date(patientData.dateOfBirth),
          gender: patientData.gender as any,
          address: patientData.address,
          isPrimary: true,
          relationship: 'SELF',
        },
      });

      return { user, patientProfile };
    });

    return {
      id: result.patientProfile.id,
      email: result.user.email,
      fullName: `${result.patientProfile.firstName} ${result.patientProfile.lastName}`,
      status: 'ACTIVE',
    };
  }

  async getPatients(
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Promise<PatientListResponseDto> {
    const skip = (page - 1) * limit;

    const where = search
      ? {
          role: 'PATIENT' as const,
          patientProfiles: {
            some: {
              OR: [
                {
                  firstName: { contains: search, mode: 'insensitive' as const },
                },
                {
                  lastName: { contains: search, mode: 'insensitive' as const },
                },
              ],
            },
          },
        }
      : { role: 'PATIENT' as const };

    const [patients, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          patientProfiles: {
            where: { isPrimary: true },
            take: 1,
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      patients: patients.map((patient) => ({
        id: patient.patientProfiles[0]?.id || 0,
        email: patient.email,
        fullName: patient.patientProfiles[0]
          ? `${patient.patientProfiles[0].firstName} ${patient.patientProfiles[0].lastName}`
          : 'N/A',
        status: 'ACTIVE',
      })),
      total,
      page,
      limit,
    };
  }

  async getPatientById(id: number): Promise<PatientDetailResponseDto> {
    const patient = await this.prisma.patientProfile.findUnique({
      where: { id },
      include: {
        manager: true,
      },
    });

    if (!patient) {
      throw new NotFoundException('Không tìm thấy patient');
    }

    return {
      id: patient.id,
      email: patient.manager.email,
      fullName: `${patient.firstName} ${patient.lastName}`,
      phone: patient.phone,
      dateOfBirth: patient.dateOfBirth.toISOString().split('T')[0],
      gender: patient.gender,
      address: patient.address || undefined,
      status: 'ACTIVE',
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt,
    };
  }

  async updatePatient(
    id: number,
    updatePatientDto: UpdatePatientDto,
  ): Promise<CreatePatientResponseDto> {
    const patient = await this.prisma.patientProfile.findUnique({
      where: { id },
      include: { manager: true },
    });

    if (!patient) {
      throw new NotFoundException('Không tìm thấy patient');
    }

    const updateData: any = {};
    if (updatePatientDto.fullName) {
      const nameParts = updatePatientDto.fullName.split(' ');
      updateData.firstName = nameParts[0];
      updateData.lastName = nameParts.slice(1).join(' ');
    }
    if (updatePatientDto.phone) updateData.phone = updatePatientDto.phone;
    if (updatePatientDto.dateOfBirth)
      updateData.dateOfBirth = new Date(updatePatientDto.dateOfBirth);
    if (updatePatientDto.gender) updateData.gender = updatePatientDto.gender;
    if (updatePatientDto.address) updateData.address = updatePatientDto.address;

    const updatedPatient = await this.prisma.patientProfile.update({
      where: { id },
      data: updateData,
      include: { manager: true },
    });

    return {
      id: updatedPatient.id,
      email: updatedPatient.manager.email,
      fullName: `${updatedPatient.firstName} ${updatedPatient.lastName}`,
      status: 'ACTIVE',
    };
  }

  async deletePatient(id: number): Promise<{ message: string }> {
    const patient = await this.prisma.patientProfile.findUnique({
      where: { id },
      include: { manager: true },
    });

    if (!patient) {
      throw new NotFoundException('Không tìm thấy patient');
    }

    await this.prisma.$transaction(async (tx) => {
      // Delete all patient profiles
      await tx.patientProfile.deleteMany({
        where: { managerId: patient.managerId },
      });

      // Delete user
      await tx.user.delete({
        where: { id: patient.managerId },
      });
    });

    return { message: 'Xóa patient thành công' };
  }
}
