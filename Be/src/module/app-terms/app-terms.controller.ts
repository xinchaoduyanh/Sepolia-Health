import { Controller, Get, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { AppTermsService } from './app-terms.service';
import { AppTermsDetailResponseDto } from '../admin/app-terms/admin-app-terms.dto';
import { Public } from '@/common/decorators';
import { AppTermsType } from '@prisma/client';

@ApiTags('App Terms (Public)')
@Controller('app-terms')
export class AppTermsController {
  constructor(private readonly appTermsService: AppTermsService) {}

  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy tất cả điều khoản đang được áp dụng' })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách điều khoản thành công',
    type: [AppTermsDetailResponseDto],
  })
  async getAllActiveTerms(): Promise<AppTermsDetailResponseDto[]> {
    return this.appTermsService.getAllActiveTerms();
  }

  @Get(':type')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy điều khoản theo loại (bản đang active)' })
  @ApiParam({
    name: 'type',
    enum: AppTermsType,
    description: 'Loại điều khoản',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy điều khoản thành công',
    type: AppTermsDetailResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy điều khoản' })
  async getTermsByType(
    @Param('type') type: AppTermsType,
  ): Promise<AppTermsDetailResponseDto> {
    return this.appTermsService.getTermsByType(type);
  }
}
