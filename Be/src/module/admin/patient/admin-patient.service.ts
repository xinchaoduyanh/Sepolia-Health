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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _adminId: number, // Admin ID for audit purposes
  ): Promise<CreatePatientResponseDto> {
    const { email, password, phone, patientProfiles } = createPatientDto;

    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email đã được sử dụng');
    }

    // Check if phone already exists
    const existingPhone = await this.prisma.user.findUnique({
      where: { phone },
    });

    if (existingPhone) {
      throw new ConflictException('Số điện thoại đã được sử dụng');
    }

    // Create user and patient profiles
    const result = await this.prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email,
          password, // Store password as plain text
          phone,
          role: 'PATIENT',
          status: 'ACTIVE',
        },
      });

      // Create patient profiles
      const createdProfiles = await Promise.all(
        patientProfiles.map((profile) =>
          tx.patientProfile.create({
            data: {
              managerId: user.id,
              firstName: profile.firstName,
              lastName: profile.lastName,
              phone: profile.phone,
              dateOfBirth: new Date(profile.dateOfBirth),
              gender: profile.gender as any,
              relationship: profile.relationship as any,
              avatar: profile.avatar || undefined,
              idCardNumber: profile.idCardNumber || undefined,
              occupation: profile.occupation || undefined,
              nationality: profile.nationality || undefined,
              address: profile.address || undefined,
              healthDetailsJson: profile.healthDetailsJson as any,
            },
          }),
        ),
      );

      return { user, patientProfiles: createdProfiles };
    });

    return {
      id: result.user.id,
      email: result.user.email,
      phone: result.user.phone || '',
      status: result.user.status,
      patientProfiles: result.patientProfiles.map((profile) => ({
        id: profile.id,
        firstName: profile.firstName,
        lastName: profile.lastName,
        fullName: `${profile.firstName} ${profile.lastName}`,
        dateOfBirth: profile.dateOfBirth.toISOString().split('T')[0],
        gender: profile.gender,
        phone: profile.phone,
        relationship: profile.relationship,
        avatar: profile.avatar || undefined,
        idCardNumber: profile.idCardNumber || undefined,
        occupation: profile.occupation || undefined,
        nationality: profile.nationality || undefined,
        address: profile.address || undefined,
        healthDetailsJson: profile.healthDetailsJson as Record<string, any>,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      })),
      createdAt: result.user.createdAt,
      updatedAt: result.user.updatedAt,
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
          OR: [
            { email: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search, mode: 'insensitive' as const } },
            {
              patientProfiles: {
                some: {
                  OR: [
                    {
                      firstName: {
                        contains: search,
                        mode: 'insensitive' as const,
                      },
                    },
                    {
                      lastName: {
                        contains: search,
                        mode: 'insensitive' as const,
                      },
                    },
                  ],
                },
              },
            },
          ],
        }
      : { role: 'PATIENT' as const };

    const [patients, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          patientProfiles: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      patients: patients.map((patient) => ({
        id: patient.id,
        email: patient.email,
        phone: patient.phone || '',
        status: patient.status,
        patientProfiles: patient.patientProfiles.map((profile) => ({
          id: profile.id,
          firstName: profile.firstName,
          lastName: profile.lastName,
          fullName: `${profile.firstName} ${profile.lastName}`,
          dateOfBirth: profile.dateOfBirth.toISOString().split('T')[0],
          gender: profile.gender,
          phone: profile.phone,
          relationship: profile.relationship,
          avatar: profile.avatar || undefined,
          idCardNumber: profile.idCardNumber || undefined,
          occupation: profile.occupation || undefined,
          nationality: profile.nationality || undefined,
          address: profile.address || undefined,
          healthDetailsJson: profile.healthDetailsJson as Record<string, any>,
          createdAt: profile.createdAt,
          updatedAt: profile.updatedAt,
        })),
        createdAt: patient.createdAt,
        updatedAt: patient.updatedAt,
      })),
      total,
      page,
      limit,
    };
  }

  async getPatientById(id: number): Promise<PatientDetailResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        patientProfiles: true,
      },
    });

    if (!user || user.role !== 'PATIENT') {
      throw new NotFoundException('Không tìm thấy patient');
    }

    return {
      id: user.id,
      email: user.email,
      phone: user.phone || '',
      status: user.status,
      patientProfiles: user.patientProfiles.map((profile) => ({
        id: profile.id,
        firstName: profile.firstName,
        lastName: profile.lastName,
        fullName: `${profile.firstName} ${profile.lastName}`,
        dateOfBirth: profile.dateOfBirth.toISOString().split('T')[0],
        gender: profile.gender,
        phone: profile.phone,
        relationship: profile.relationship,
        avatar: profile.avatar || undefined,
        idCardNumber: profile.idCardNumber || undefined,
        occupation: profile.occupation || undefined,
        nationality: profile.nationality || undefined,
        address: profile.address || undefined,
        healthDetailsJson: profile.healthDetailsJson as Record<string, any>,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      })),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async updatePatient(
    id: number,
    updatePatientDto: UpdatePatientDto,
  ): Promise<CreatePatientResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { patientProfiles: true },
    });

    if (!user || user.role !== 'PATIENT') {
      throw new NotFoundException('Không tìm thấy patient');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Update user fields
      const userUpdateData: any = {};
      if (updatePatientDto.email) userUpdateData.email = updatePatientDto.email;
      if (updatePatientDto.password)
        userUpdateData.password = updatePatientDto.password;
      if (updatePatientDto.phone) userUpdateData.phone = updatePatientDto.phone;
      if (updatePatientDto.status)
        userUpdateData.status = updatePatientDto.status as any;

      await tx.user.update({
        where: { id },
        data: userUpdateData,
      });

      // Handle patient profiles updates
      if (updatePatientDto.patientProfiles) {
        const {
          update,
          create,
          delete: deleteIds,
        } = updatePatientDto.patientProfiles;

        // Update existing profiles
        if (update && update.length > 0) {
          await Promise.all(
            update.map((profileUpdate) => {
              const updateData: any = {};
              if (profileUpdate.firstName)
                updateData.firstName = profileUpdate.firstName;
              if (profileUpdate.lastName)
                updateData.lastName = profileUpdate.lastName;
              if (profileUpdate.dateOfBirth)
                updateData.dateOfBirth = new Date(profileUpdate.dateOfBirth);
              if (profileUpdate.gender)
                updateData.gender = profileUpdate.gender as any;
              if (profileUpdate.phone) updateData.phone = profileUpdate.phone;
              if (profileUpdate.relationship)
                updateData.relationship = profileUpdate.relationship as any;
              if (profileUpdate.avatar !== undefined)
                updateData.avatar = profileUpdate.avatar;
              if (profileUpdate.idCardNumber !== undefined)
                updateData.idCardNumber = profileUpdate.idCardNumber;
              if (profileUpdate.occupation !== undefined)
                updateData.occupation = profileUpdate.occupation;
              if (profileUpdate.nationality !== undefined)
                updateData.nationality = profileUpdate.nationality;
              if (profileUpdate.address !== undefined)
                updateData.address = profileUpdate.address;
              if (profileUpdate.healthDetailsJson !== undefined)
                updateData.healthDetailsJson = profileUpdate.healthDetailsJson;

              return tx.patientProfile.update({
                where: { id: profileUpdate.id },
                data: updateData,
              });
            }),
          );
        }

        // Create new profiles
        if (create && create.length > 0) {
          await Promise.all(
            create.map((profileData) =>
              tx.patientProfile.create({
                data: {
                  managerId: id,
                  firstName: profileData.firstName,
                  lastName: profileData.lastName,
                  phone: profileData.phone,
                  dateOfBirth: new Date(profileData.dateOfBirth),
                  gender: profileData.gender as any,
                  relationship: profileData.relationship as any,
                  avatar: profileData.avatar,
                  idCardNumber: profileData.idCardNumber,
                  occupation: profileData.occupation,
                  nationality: profileData.nationality,
                  address: profileData.address,
                  healthDetailsJson: profileData.healthDetailsJson as any,
                },
              }),
            ),
          );
        }

        // Delete profiles
        if (deleteIds && deleteIds.length > 0) {
          await tx.patientProfile.deleteMany({
            where: {
              id: { in: deleteIds },
              managerId: id,
            },
          });
        }
      }

      // Get updated user with all profiles
      const finalUser = await tx.user.findUnique({
        where: { id },
        include: { patientProfiles: true },
      });

      return finalUser!;
    });

    return {
      id: result.id,
      email: result.email,
      phone: result.phone || '',
      status: result.status,
      patientProfiles: result.patientProfiles.map((profile) => ({
        id: profile.id,
        firstName: profile.firstName,
        lastName: profile.lastName,
        fullName: `${profile.firstName} ${profile.lastName}`,
        dateOfBirth: profile.dateOfBirth.toISOString().split('T')[0],
        gender: profile.gender,
        phone: profile.phone,
        relationship: profile.relationship,
        avatar: profile.avatar || undefined,
        idCardNumber: profile.idCardNumber || undefined,
        occupation: profile.occupation || undefined,
        nationality: profile.nationality || undefined,
        address: profile.address || undefined,
        healthDetailsJson: profile.healthDetailsJson as Record<string, any>,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      })),
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  }

  async deletePatient(id: number): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { patientProfiles: true },
    });

    if (!user || user.role !== 'PATIENT') {
      throw new NotFoundException('Không tìm thấy patient');
    }

    await this.prisma.$transaction(async (tx) => {
      // Delete all patient profiles
      await tx.patientProfile.deleteMany({
        where: { managerId: id },
      });

      // Delete user
      await tx.user.delete({
        where: { id },
      });
    });

    return { message: 'Xóa patient thành công' };
  }
}
