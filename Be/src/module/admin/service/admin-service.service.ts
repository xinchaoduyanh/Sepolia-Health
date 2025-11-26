import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import {
  CreateServiceDto,
  UpdateServiceDto,
  CreateServiceResponseDto,
  ServicesListResponseDto,
  ServiceDetailResponseDto,
  UpdateServiceResponseDto,
  GetServicesQueryDto,
} from './admin-service.dto';

@Injectable()
export class AdminServiceService {
  constructor(private readonly prisma: PrismaService) {}

  async createService(
    createServiceDto: CreateServiceDto,
  ): Promise<CreateServiceResponseDto> {
    // Verify specialty exists
    const specialty = await this.prisma.specialty.findUnique({
      where: { id: createServiceDto.specialtyId },
    });

    if (!specialty) {
      throw new NotFoundException('Chuyên khoa không tồn tại');
    }

    const service = await this.prisma.service.create({
      data: createServiceDto,
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
    });

    return {
      id: service.id,
      name: service.name,
      price: service.price,
      duration: service.duration,
      description: service.description || undefined,
      createdAt: service.createdAt!,
      updatedAt: service.updatedAt || undefined,
      specialty: {
        id: service.specialty.id,
        name: service.specialty.name,
        description: service.specialty.description || undefined,
        icon: service.specialty.icon || undefined,
      },
    };
  }

  async getServices(
    query: GetServicesQueryDto,
  ): Promise<ServicesListResponseDto> {
    const { page, limit, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    const [services, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          name: 'asc',
        },
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
      this.prisma.service.count({ where }),
    ]);

    return {
      services: services.map((service) => ({
        id: service.id,
        name: service.name,
        price: service.price,
        duration: service.duration,
        description: service.description || undefined,
        createdAt: service.createdAt!,
        updatedAt: service.updatedAt || undefined,
        specialty: {
          id: service.specialty.id,
          name: service.specialty.name,
          description: service.specialty.description || undefined,
          icon: service.specialty.icon || undefined,
        },
      })),
      total,
      page,
      limit,
    };
  }

  async getService(id: number): Promise<ServiceDetailResponseDto> {
    const service = await this.prisma.service.findUnique({
      where: { id },
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
    });

    if (!service) {
      throw new NotFoundException('Dịch vụ không tồn tại');
    }

    return {
      id: service.id,
      name: service.name,
      price: service.price,
      duration: service.duration,
      description: service.description || undefined,
      createdAt: service.createdAt!,
      updatedAt: service.updatedAt || undefined,
      specialty: {
        id: service.specialty.id,
        name: service.specialty.name,
        description: service.specialty.description || undefined,
        icon: service.specialty.icon || undefined,
      },
    };
  }

  async updateService(
    id: number,
    updateServiceDto: UpdateServiceDto,
  ): Promise<UpdateServiceResponseDto> {
    const existingService = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!existingService) {
      throw new NotFoundException('Dịch vụ không tồn tại');
    }

    // Verify specialty exists if updating specialtyId
    if (updateServiceDto.specialtyId) {
      const specialty = await this.prisma.specialty.findUnique({
        where: { id: updateServiceDto.specialtyId },
      });

      if (!specialty) {
        throw new NotFoundException('Chuyên khoa không tồn tại');
      }
    }

    const service = await this.prisma.service.update({
      where: { id },
      data: updateServiceDto,
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
    });

    return {
      id: service.id,
      name: service.name,
      price: service.price,
      duration: service.duration,
      description: service.description || undefined,
      createdAt: service.createdAt!,
      updatedAt: service.updatedAt || undefined,
      specialty: {
        id: service.specialty.id,
        name: service.specialty.name,
        description: service.specialty.description || undefined,
        icon: service.specialty.icon || undefined,
      },
    };
  }

  async deleteService(id: number): Promise<void> {
    const existingService = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!existingService) {
      throw new NotFoundException('Dịch vụ không tồn tại');
    }

    await this.prisma.service.delete({
      where: { id },
    });
  }
}
