import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { User, Role, Gender, Relationship } from '@prisma/client';
import { ERROR_MESSAGES } from '@/common/constants/error-messages';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find user by email
   */
  async isEmailExists(email: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (user) {
      throw new ConflictException(ERROR_MESSAGES.AUTH.EMAIL_ALREADY_EXISTS);
    }
    return true;
  }
  async findByEmail(email: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.AUTH.USER_NOT_FOUND);
    }
    return user;
  }
  /**
   * Find user by ID
   */
  async findById(id: number): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.AUTH.USER_NOT_FOUND);
    }
    return user;
  }

  /**
   * Create user
   */
  async createUser(userData: {
    email: string;
    password: string;
    phone?: string;
    role: Role;
    isVerified: boolean;
    verifiedAt: Date;
  }): Promise<User> {
    return await this.prisma.user.create({
      data: userData,
    });
  }

  /**
   * Create patient profile
   */
  async createPatientProfile(patientData: {
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
    isPrimary: boolean;
  }) {
    return await this.prisma.patientProfile.create({
      data: patientData,
    });
  }

  /**
   * Create user with patient profile (for registration)
   */
  async createUserWithPatientProfile(data: {
    // User data
    email: string;
    password: string;
    phone?: string;
    role: Role;
    isVerified: boolean;
    verifiedAt: Date;
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    gender: Gender;
    patientPhone: string;
    relationship: Relationship;
  }) {
    return await this.prisma.$transaction(async (tx) => {
      // Create user first
      const user = await tx.user.create({
        data: {
          email: data.email,
          password: data.password,
          phone: data.phone,
          role: data.role,
          isVerified: data.isVerified,
          verifiedAt: data.verifiedAt,
        },
      });

      // Create patient profile with basic info only
      const patientProfile = await tx.patientProfile.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          dateOfBirth: data.dateOfBirth,
          gender: data.gender,
          phone: data.patientPhone,
          relationship: data.relationship,
          managerId: user.id,
          isPrimary: true, // Always true for self-registered patients
        },
      });

      return { user, patientProfile };
    });
  }

  /**
   * Update user
   */
  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    return await this.prisma.user.update({
      where: { id },
      data: userData,
    });
  }

  /**
   * Update last login
   */
  async updateLastLogin(id: number): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }
}
