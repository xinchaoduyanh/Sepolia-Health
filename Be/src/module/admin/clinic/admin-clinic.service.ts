import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import {
  CreateClinicDto,
  UpdateClinicDto,
  CreateClinicResponseDto,
  ClinicsListResponseDto,
  ClinicDetailResponseDto,
  UpdateClinicResponseDto,
  GetClinicsQueryDto,
} from './admin-clinic.dto';

@Injectable()
export class AdminClinicService {
  constructor(private readonly prisma: PrismaService) {}

  async createClinic(
    createClinicDto: CreateClinicDto,
  ): Promise<CreateClinicResponseDto> {
    const clinic = await this.prisma.clinic.create({
      data: {
        name: createClinicDto.name,
        address: createClinicDto.address,
        phone: createClinicDto.phone || null,
        email: createClinicDto.email || null,
        description: createClinicDto.description || null,
        isActive: createClinicDto.isActive,
      },
    });

    return {
      id: clinic.id,
      name: clinic.name,
      address: clinic.address,
      phone: clinic.phone || undefined,
      email: clinic.email || undefined,
      description: clinic.description || undefined,
      isActive: clinic.isActive,
      createdAt: clinic.createdAt,
      updatedAt: clinic.updatedAt,
    };
  }

  async getClinics(query: GetClinicsQueryDto): Promise<ClinicsListResponseDto> {
    const { page, limit, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          address: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const [clinics, total] = await Promise.all([
      this.prisma.clinic.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.clinic.count({ where }),
    ]);

    return {
      clinics: clinics.map((clinic) => ({
        id: clinic.id,
        name: clinic.name,
        address: clinic.address,
        phone: clinic.phone || undefined,
        email: clinic.email || undefined,
        description: clinic.description || undefined,
        isActive: clinic.isActive,
        createdAt: clinic.createdAt,
        updatedAt: clinic.updatedAt,
      })),
      total,
      page,
      limit,
    };
  }

  async getClinic(id: number): Promise<ClinicDetailResponseDto> {
    const clinic = await this.prisma.clinic.findUnique({
      where: { id },
    });

    if (!clinic) {
      throw new NotFoundException('Phòng khám không tồn tại');
    }

    return {
      id: clinic.id,
      name: clinic.name,
      address: clinic.address,
      phone: clinic.phone || undefined,
      email: clinic.email || undefined,
      description: clinic.description || undefined,
      isActive: clinic.isActive,
      createdAt: clinic.createdAt,
      updatedAt: clinic.updatedAt,
    };
  }

  async updateClinic(
    id: number,
    updateClinicDto: UpdateClinicDto,
  ): Promise<UpdateClinicResponseDto> {
    const existingClinic = await this.prisma.clinic.findUnique({
      where: { id },
    });

    if (!existingClinic) {
      throw new NotFoundException('Phòng khám không tồn tại');
    }

    const clinic = await this.prisma.clinic.update({
      where: { id },
      data: {
        name: updateClinicDto.name,
        address: updateClinicDto.address,
        phone: updateClinicDto.phone || null,
        email: updateClinicDto.email || null,
        description: updateClinicDto.description || null,
        isActive: updateClinicDto.isActive,
      },
    });

    return {
      id: clinic.id,
      name: clinic.name,
      address: clinic.address,
      phone: clinic.phone || undefined,
      email: clinic.email || undefined,
      description: clinic.description || undefined,
      isActive: clinic.isActive,
      createdAt: clinic.createdAt,
      updatedAt: clinic.updatedAt,
    };
  }

  async deleteClinic(id: number): Promise<void> {
    const existingClinic = await this.prisma.clinic.findUnique({
      where: { id },
    });

    if (!existingClinic) {
      throw new NotFoundException('Phòng khám không tồn tại');
    }

    await this.prisma.clinic.delete({
      where: { id },
    });
  }
}
