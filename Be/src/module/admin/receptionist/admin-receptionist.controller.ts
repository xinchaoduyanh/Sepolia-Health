import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { AdminReceptionistService } from './admin-receptionist.service';
import {
  CreateReceptionistDto,
  UpdateReceptionistDto,
  CreateReceptionistResponseDto,
  ReceptionistListResponseDto,
  ReceptionistDetailResponseDto,
  CreateReceptionistDtoClass,
  UpdateReceptionistDtoClass,
  CreateReceptionistSchema,
  UpdateReceptionistSchema,
} from './admin-receptionist.dto';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import { Roles, CurrentUser } from '@/common/decorators';
import { Role } from '@prisma/client';
import type { TokenPayload } from '@/common/types/jwt.type';
import { CustomZodValidationPipe } from '@/common/pipes';

@ApiTags('Admin Receptionist Management')
@Controller('admin/receptionists')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminReceptionistController {
  constructor(
    private readonly adminReceptionistService: AdminReceptionistService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo tài khoản receptionist mới' })
  @ApiBody({ type: CreateReceptionistDtoClass })
  @ApiResponse({
    status: 201,
    description: 'Tạo receptionist thành công',
    type: CreateReceptionistResponseDto,
  })
  async createReceptionist(
    @Body(new CustomZodValidationPipe(CreateReceptionistSchema))
    createReceptionistDto: CreateReceptionistDto,
    @CurrentUser() admin: TokenPayload,
  ): Promise<CreateReceptionistResponseDto> {
    return this.adminReceptionistService.createReceptionist(
      createReceptionistDto,
      admin.userId,
    );
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy danh sách receptionist' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách thành công',
    type: ReceptionistListResponseDto,
  })
  async getReceptionists(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ): Promise<ReceptionistListResponseDto> {
    return this.adminReceptionistService.getReceptionists(page, limit, search);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy thông tin chi tiết receptionist' })
  @ApiParam({ name: 'id', description: 'ID receptionist' })
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin thành công',
    type: ReceptionistDetailResponseDto,
  })
  async getReceptionistById(
    @Param('id') id: string,
  ): Promise<ReceptionistDetailResponseDto> {
    return this.adminReceptionistService.getReceptionistById(Number(id));
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cập nhật thông tin receptionist' })
  @ApiParam({ name: 'id', description: 'ID receptionist' })
  @ApiBody({ type: UpdateReceptionistDtoClass })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật thành công',
    type: CreateReceptionistResponseDto,
  })
  async updateReceptionist(
    @Param('id') id: string,
    @Body(new CustomZodValidationPipe(UpdateReceptionistSchema))
    updateReceptionistDto: UpdateReceptionistDto,
  ): Promise<CreateReceptionistResponseDto> {
    return this.adminReceptionistService.updateReceptionist(
      Number(id),
      updateReceptionistDto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa receptionist' })
  @ApiParam({ name: 'id', description: 'ID receptionist' })
  @ApiResponse({
    status: 200,
    description: 'Xóa thành công',
  })
  async deleteReceptionist(
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    return this.adminReceptionistService.deleteReceptionist(Number(id));
  }
}
