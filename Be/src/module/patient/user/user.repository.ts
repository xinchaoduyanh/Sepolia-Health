import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { ERROR_MESSAGES } from '@/common/constants/error-messages';
import { Gender, Relationship } from '@prisma/client';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find user by ID
   */
  async findUserById(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        doctorProfile: true,
        receptionistProfile: true,
        patientProfiles: {
          orderBy: [
            { relationship: 'asc' }, // SELF profile first
            { createdAt: 'asc' }, // Then by creation date
          ],
        },
      },
    });

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.AUTH.USER_NOT_FOUND);
    }

    return user;
  }

  /**
   * Find user by ID (simple)
   */
  async findUserByIdSimple(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.AUTH.USER_NOT_FOUND);
    }

    return user;
  }

  /**
   * Update user
   */
  async updateUser(userId: number, data: any) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  /**
   * Get all patient profiles for a user
   */
  async getPatientProfiles(userId: number) {
    return this.prisma.patientProfile.findMany({
      where: { managerId: userId },
      orderBy: [
        { relationship: 'asc' }, // SELF profile first
        { createdAt: 'asc' }, // Then by creation date
      ],
    });
  }

  /**
   * Create patient profile
   */
  async createPatientProfile(data: {
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    gender: Gender;
    phone: string;
    relationship: Relationship;
    avatar?: string;
    idCardNumber?: string;
    occupation?: string;
    nationality?: string;
    address?: string;
    healthDetailsJson?: any;
    managerId: number;
  }) {
    return this.prisma.patientProfile.create({
      data,
    });
  }

  /**
   * Find patient profile by ID and manager ID
   */
  async findPatientProfileByIdAndManagerId(
    profileId: number,
    managerId: number,
  ) {
    const profile = await this.prisma.patientProfile.findFirst({
      where: { id: profileId, managerId },
    });

    if (!profile) {
      throw new NotFoundException('Không tìm thấy hồ sơ bệnh nhân');
    }

    return profile;
  }

  /**
   * Update patient profile
   */
  async updatePatientProfile(profileId: number, data: any) {
    return this.prisma.patientProfile.update({
      where: { id: profileId },
      data,
    });
  }

  /**
   * Get primary profile (SELF relationship)
   */
  async getPrimaryProfile(userId: number) {
    return this.prisma.patientProfile.findFirst({
      where: { managerId: userId, relationship: 'SELF' },
    });
  }

  /**
   * Count appointments for a patient profile
   */
  async countAppointmentsForProfile(profileId: number) {
    return this.prisma.appointment.count({
      where: { patientProfileId: profileId },
    });
  }

  /**
   * Delete patient profile
   */
  async deletePatientProfile(profileId: number) {
    return this.prisma.patientProfile.delete({
      where: { id: profileId },
    });
  }

  /**
   * Update doctor profile
   */
  async updateDoctorProfile(profileId: number, data: any) {
    return this.prisma.doctorProfile.update({
      where: { id: profileId },
      data,
    });
  }

  /**
   * Update receptionist profile
   */
  async updateReceptionistProfile(profileId: number, data: any) {
    return this.prisma.receptionistProfile.update({
      where: { id: profileId },
      data,
    });
  }

  /**
   * Update patient profile (for avatar)
   */
  async updatePatientProfileForAvatar(profileId: number, data: any) {
    return this.prisma.patientProfile.update({
      where: { id: profileId },
      data,
    });
  }
}
