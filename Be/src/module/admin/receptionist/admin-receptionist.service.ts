import { PrismaService } from '@/common/prisma/prisma.service';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role, UserStatus } from '@prisma/client';
import {
  CreateReceptionistDto,
  CreateReceptionistResponseDto,
  GetReceptionistsQueryDto,
  ReceptionistDetailResponseDto,
  ReceptionistListResponseDto,
  UpdateReceptionistDto,
  UpdateReceptionistStatusDto,
} from './admin-receptionist.dto';

@Injectable()
export class AdminReceptionistService {
  constructor(private readonly prisma: PrismaService) {}

  async createReceptionist(
    createReceptionistDto: CreateReceptionistDto,
    adminId: number,
  ): Promise<CreateReceptionistResponseDto> {
    const { email, password, ...receptionistData } = createReceptionistDto;

    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email đã được sử dụng');
    }

    // Create user and receptionist profile
    const result = await this.prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email,
          password: password, // Store password as plain text
          role: Role.RECEPTIONIST,
          status: UserStatus.ACTIVE,
        },
      });

      // Create receptionist profile
      const receptionistProfile = await tx.receptionistProfile.create({
        data: {
          userId: user.id,
          firstName: receptionistData.fullName.split(' ')[0] || '',
          lastName:
            receptionistData.fullName.split(' ').slice(1).join(' ') || '',
        },
      });

      return { user, receptionistProfile };
    });

    return {
      id: result.receptionistProfile.id,
      email: result.user.email,
      fullName: `${result.receptionistProfile.lastName} ${result.receptionistProfile.firstName}`,
      phone: result.user.phone || '',
      status: result.user.status,
      avatar: result.receptionistProfile.avatar || null,
      createdAt: result.receptionistProfile.createdAt,
    };
  }

  async getReceptionists(
    query: GetReceptionistsQueryDto,
  ): Promise<ReceptionistListResponseDto> {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          role: 'RECEPTIONIST' as const,
          receptionistProfile: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' as const } },
              { lastName: { contains: search, mode: 'insensitive' as const } },
            ],
          },
        }
      : { role: 'RECEPTIONIST' as const };

    const [receptionists, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          receptionistProfile: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      receptionists: receptionists.map((receptionist) => ({
        id: receptionist.receptionistProfile!.id,
        email: receptionist.email,
        fullName: `${receptionist.receptionistProfile!.lastName} ${receptionist.receptionistProfile!.firstName}`,
        phone: receptionist.phone || '',
        status: receptionist.status,
        avatar: receptionist.receptionistProfile!.avatar || null,
        createdAt: receptionist.createdAt,
      })),
      total,
      page,
      limit,
    };
  }

  async getReceptionistById(
    id: number,
  ): Promise<ReceptionistDetailResponseDto> {
    const receptionist = await this.prisma.receptionistProfile.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!receptionist) {
      throw new NotFoundException('Không tìm thấy receptionist');
    }

    return {
      id: receptionist.id,
      email: receptionist.user.email,
      fullName: `${receptionist.lastName} ${receptionist.firstName}`,
      phone: receptionist.user.phone || '',
      address: receptionist.user.phone || '',
      status: 'ACTIVE',
      createdAt: receptionist.createdAt,
      updatedAt: receptionist.updatedAt,
    };
  }

  async updateReceptionist(
    id: number,
    updateReceptionistDto: UpdateReceptionistDto,
  ): Promise<CreateReceptionistResponseDto> {
    const receptionist = await this.prisma.receptionistProfile.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!receptionist) {
      throw new NotFoundException('Không tìm thấy receptionist');
    }

    // Prepare update data based on the DTO
    const updateData: any = {};
    if (updateReceptionistDto.fullName) {
      const nameParts = updateReceptionistDto.fullName.split(' ');
      updateData.firstName = nameParts[0];
      updateData.lastName = nameParts.slice(1).join(' ');
    }
    if (updateReceptionistDto.phone)
      updateData.phone = updateReceptionistDto.phone;

    const updatedReceptionist = await this.prisma.receptionistProfile.update({
      where: { id },
      data: updateData,
      include: { user: true },
    });

    return {
      id: updatedReceptionist.id,
      email: updatedReceptionist.user.email,
      fullName: `${updatedReceptionist.lastName} ${updatedReceptionist.firstName}`,
      phone: updatedReceptionist.user.phone || '',
      status: updatedReceptionist.user.status,
    };
  }

  async deleteReceptionist(id: number): Promise<{ message: string }> {
    const receptionist = await this.prisma.receptionistProfile.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!receptionist) {
      throw new NotFoundException('Không tìm thấy receptionist');
    }

    await this.prisma.$transaction(async (tx) => {
      // Delete receptionist profile
      await tx.receptionistProfile.delete({
        where: { id },
      });

      // Delete user
      await tx.user.delete({
        where: { id: receptionist.userId },
      });
    });

    return { message: 'Xóa receptionist thành công' };
  }

  async updateReceptionistStatus(
    id: number,
    updateReceptionistStatusDto: UpdateReceptionistStatusDto,
  ): Promise<CreateReceptionistResponseDto> {
    const receptionist = await this.prisma.receptionistProfile.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!receptionist) {
      throw new NotFoundException('Không tìm thấy receptionist');
    }

    // Update user status
    const updatedUser = await this.prisma.user.update({
      where: { id: receptionist.userId },
      data: {
        status: updateReceptionistStatusDto.status,
      },
      include: {
        receptionistProfile: true,
      },
    });

    const profile = updatedUser.receptionistProfile!;

    return {
      id: profile.id,
      email: updatedUser.email,
      fullName: `${profile.lastName} ${profile.firstName}`,
      phone: updatedUser.phone || '',
      status: updatedUser.status,
      createdAt: profile.createdAt,
    };
  }
}
