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
import { z } from 'zod';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CurrentUser } from '@/common/decorators';
import type { TokenPayload } from '@/common/types/jwt.type';

// DTOs
const UploadFileDto = z.object({
  file: z.any(), // File will be handled by multer
});

const UploadUrlDto = z.object({
  url: z.string().url('URL không hợp lệ'),
});

const UploadFileResponseDto = z.object({
  success: z.boolean(),
  url: z.string().optional(),
  error: z.string().optional(),
});

type UploadFileDtoType = z.infer<typeof UploadFileDto>;
type UploadUrlDtoType = z.infer<typeof UploadUrlDto>;
type UploadFileResponseDtoType = z.infer<typeof UploadFileResponseDto>;

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('file')
  @HttpCode(HttpStatus.OK)
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
  async uploadFromUrl(
    @Body() body: UploadUrlDtoType,
  ): Promise<UploadFileResponseDtoType> {
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

    // Update user avatar URL
    await this.prisma.user.update({
      where: { id: user.userId },
      data: { avatar: uploadResult.url },
    });

    return uploadResult;
  }

  @Post('avatar/url')
  @HttpCode(HttpStatus.OK)
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

    // Update user avatar URL
    await this.prisma.user.update({
      where: { id: user.userId },
      data: { avatar: body.url },
    });

    return {
      success: true,
      url: body.url,
    };
  }
}
