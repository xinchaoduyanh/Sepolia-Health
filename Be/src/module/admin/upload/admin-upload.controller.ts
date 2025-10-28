import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AdminUploadService } from './admin-upload.service';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import { CurrentUser, Roles } from '@/common/decorators';
import { Role } from '@prisma/client';

@ApiBearerAuth()
@ApiTags('Admin Upload')
@Controller('admin/upload')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminUploadController {
  constructor(private readonly adminUploadService: AdminUploadService) {}

  @Post('avatar')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiOperation({ summary: 'Upload avatar cho admin (temporary upload)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
          description: 'File ảnh đại diện (JPEG, PNG, WebP, tối đa 5MB)',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Upload avatar thành công',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        url: { type: 'string' },
      },
    },
  })
  async uploadAvatarFile(
    @CurrentUser('userId') userId: number,
    @UploadedFile() file: any,
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file ảnh');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Chỉ chấp nhận file ảnh (JPEG, PNG, WebP)');
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('Kích thước file không được vượt quá 5MB');
    }

    return this.adminUploadService.uploadAvatarFile(userId, file);
  }
}
