import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
} from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaginationResultDto } from '@/common/dto/pagination-result.dto';
import { DoctorProfile } from '@prisma/client';

@ApiBearerAuth()
@ApiTags('Doctor')
@Controller('doctor')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Post()
  create(@Body() createDoctorDto: CreateDoctorDto) {
    return this.doctorService.create(createDoctorDto);
  }

  @Get()
  @ApiResponse({
    status: HttpStatus.OK,
    type: PaginationResultDto<DoctorProfile>,
  })
  async findAll(): Promise<PaginationResultDto<DoctorProfile>> {
    return await this.doctorService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.doctorService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDoctorDto: UpdateDoctorDto) {
    return this.doctorService.update(+id, updateDoctorDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.doctorService.remove(+id);
  }
}
