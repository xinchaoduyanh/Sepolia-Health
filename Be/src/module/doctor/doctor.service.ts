import { Injectable } from '@nestjs/common';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { PaginationResultDto } from '@/common/dto/pagination-result.dto';
import { paginate } from '@/common/helper/paginate';
import { DoctorProfile } from '@prisma/client';
import { PrismaService } from '@/common/prisma/prisma.service';

@Injectable()
export class DoctorService {
  constructor(private readonly prismaService: PrismaService) {}
  create(createDoctorDto: CreateDoctorDto) {
    return 'This action adds a new doctor';
  }

  async findAll(): Promise<PaginationResultDto<DoctorProfile>> {
    return await paginate(this.prismaService.doctorProfile, 1, 10);
  }

  findOne(id: number) {
    return `This action returns a #${id} doctor`;
  }

  update(id: number, updateDoctorDto: UpdateDoctorDto) {
    return `This action updates a #${id} doctor`;
  }

  remove(id: number) {
    return `This action removes a #${id} doctor`;
  }
}
