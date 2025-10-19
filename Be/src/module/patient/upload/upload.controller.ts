import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { UploadService } from '@/common/modules';
// zod no longer needed
import { PrismaService } from '@/common/prisma/prisma.service';
import { CurrentUser } from '@/common/decorators';
import type { TokenPayload } from '@/common/types/jwt.type';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import { Roles } from '@/common/decorators';
import { Role } from '@prisma/client';
// DTOs
type UploadUrlDtoType = {
  url: string;
};

type UploadFileResponseDtoType = {
  success: boolean;
  url?: string;
  error?: string;
};

@ApiBearerAuth()
@ApiTags('Patient Upload')
@Controller('patient/upload')
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('file')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PATIENT)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload file lên S3' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File cần upload (tối đa 10MB)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Upload file thành công',
  })
  async uploadFile(
    @CurrentUser() user: TokenPayload,
    @UploadedFile() file: any,
  ): Promise<UploadFileResponseDtoType> {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file');
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('Kích thước file không được vượt quá 10MB');
    }

    // Generate unique filename
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `uploads/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;

    // Upload to S3
    const uploadResult = await this.uploadService.uploadFile({
      key: fileName,
      body: file.buffer,
      contentType: file.mimetype,
    });

    return uploadResult;
  }

  @Post('url')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PATIENT)
  @ApiOperation({ summary: 'Upload từ URL (sẽ lưu URL trực tiếp)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          format: 'uri',
          description: 'URL của file cần lưu',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Lưu URL thành công',
  })
  uploadFromUrl(
    @CurrentUser() user: TokenPayload,
    @Body() body: UploadUrlDtoType,
  ): UploadFileResponseDtoType {
    // Validate URL
    try {
      new URL(body.url);
    } catch {
      throw new BadRequestException('URL không hợp lệ');
    }

    // For URL upload, we just return the URL as is
    // In a real scenario, you might want to download and re-upload to S3
    return {
      success: true,
      url: body.url,
    };
  }

  @Post('avatar/file')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PATIENT)
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiOperation({ summary: 'Upload avatar từ file' })
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
    status: 200,
    description: 'Upload avatar thành công',
  })
  async uploadAvatarFile(
    @CurrentUser() user: TokenPayload,
    @UploadedFile() file: any,
  ): Promise<UploadFileResponseDtoType> {
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

    // Generate unique filename
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `avatars/${user.userId}-${Date.now()}.${fileExtension}`;

    // Upload to S3
    const uploadResult = await this.uploadService.uploadFile({
      key: fileName,
      body: file.buffer,
      contentType: file.mimetype,
    });

    if (!uploadResult.success) {
      throw new BadRequestException(
        'Lỗi khi upload ảnh: ' + uploadResult.error,
      );
    }

    // Update patient profile avatar URL
    const userData = await this.prisma.user.findUnique({
      where: { id: user.userId },
      include: {
        patientProfiles: {
          where: { isPrimary: true },
          take: 1,
        },
      },
    });

    if (
      userData?.patientProfiles?.length &&
      userData?.patientProfiles?.length > 0
    ) {
      await this.prisma.patientProfile.update({
        where: { id: userData?.patientProfiles?.[0]?.id },
        data: { avatar: uploadResult.url },
      });
    }

    return uploadResult;
  }

  @Post('avatar/url')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PATIENT)
  @ApiOperation({ summary: 'Upload avatar từ URL' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          format: 'uri',
          description: 'URL của ảnh đại diện',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật avatar thành công',
  })
  async uploadAvatarUrl(
    @CurrentUser() user: TokenPayload,
    @Body() body: UploadUrlDtoType,
  ): Promise<UploadFileResponseDtoType> {
    // Validate URL
    try {
      new URL(body.url);
    } catch {
      throw new BadRequestException('URL không hợp lệ');
    }

    // Update patient profile avatar URL
    const userData = await this.prisma.user.findUnique({
      where: { id: user.userId },
      include: {
        patientProfiles: {
          where: { isPrimary: true },
          take: 1,
        },
      },
    });

    if (
      userData?.patientProfiles?.length &&
      userData?.patientProfiles?.length > 0
    ) {
      await this.prisma.patientProfile.update({
        where: { id: userData?.patientProfiles?.[0]?.id },
        data: { avatar: body.url },
      });
    }

    return {
      success: true,
      url: body.url,
    };
  }
}
