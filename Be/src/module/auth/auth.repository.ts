import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { User, RegistrationOtp } from '@prisma/client';
import { ERROR_MESSAGES } from '@/common/constants/messages';
import { Role } from '@prisma/client';
@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find user by email
   */
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
    firstName: string;
    lastName: string;
    phone: string;
    role: Role;
  }): Promise<User> {}

  /**
   * Update user
   */
  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: userData,
    });
  }

  /**
   * Create registration OTP
   */
  async createRegistrationOtp(otpData: {
    email: string;
    otp: string;
    expiresAt: Date;
    registrationData: any;
  }): Promise<RegistrationOtp> {
    return this.prisma.registrationOtp.create({
      data: otpData,
    });
  }

  /**
   * Find registration OTP
   */
  async findRegistrationOtp(
    email: string,
    otp: string,
  ): Promise<RegistrationOtp> {
    return this.prisma.registrationOtp.findFirst({
      where: {
        email,
        otp,
        expiresAt: { gt: new Date() },
      },
    });
  }

  /**
   * Delete registration OTP
   */
  async deleteRegistrationOtp(id: number): Promise<void> {
    await this.prisma.registrationOtp.delete({
      where: { id },
    });
  }

  /**
   * Clean expired OTPs
   */
  async cleanExpiredOtps(): Promise<number> {
    const result = await this.prisma.registrationOtp.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
    return result.count;
  }
}
