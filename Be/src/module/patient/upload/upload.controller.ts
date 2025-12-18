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
import { PrismaService } from '@/common/prisma/prisma.service';
import { CurrentUser } from '@/common/decorators';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '@/common/decorators';
import { Role } from '@prisma/client';
import { fileTypeFromBuffer } from 'file-type';
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
@Roles(Role.PATIENT)
@ApiTags('Patient Upload')
@Controller('patient/upload')
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
    status: HttpStatus.OK,
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

    // Enhanced file type validation
    const fileType = await fileTypeFromBuffer(file.buffer);
    if (!fileType) {
      throw new BadRequestException('Không thể xác định loại file');
    }

    // Validate file extension
    const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'txt', 'zip', 'rar'];

    if (!allowedExtensions.includes(fileExtension)) {
      throw new BadRequestException('Loại file không được phép');
    }

    // Validate MIME type matches extension
    const allowedMimeTypes = [
      'image/jpeg', 'image/png', 'image/gif',
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'application/zip', 'application/x-rar-compressed'
    ];

    if (!allowedMimeTypes.includes(file.mime)) {
      throw new BadRequestException('Loại file không được phép');
    }

    // Generate unique filename with validated extension
    const safeExtension = fileType.ext || fileExtension;
    const fileName = `uploads/${Date.now()}-${Math.random().toString(36).substring(2)}.${safeExtension}`;

    // Upload to S3
    const uploadResult = await this.uploadService.uploadFile({
      key: fileName,
      body: file.buffer,
      contentType: fileType.mime || file.mimetype,
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
    status: HttpStatus.OK,
    description: 'Lưu URL thành công',
  })
  uploadFromUrl(@Body() body: UploadUrlDtoType): UploadFileResponseDtoType {
    // Validate URL format
    let url;
    try {
      url = new URL(body.url);
    } catch {
      throw new BadRequestException('URL không hợp lệ');
    }

    // Security checks for URL
    const allowedProtocols = ['http:', 'https:'];
    if (!allowedProtocols.includes(url.protocol)) {
      throw new BadRequestException('Chỉ chấp nhận HTTP và HTTPS URLs');
    }

    // Block potentially dangerous URLs
    const dangerousPatterns = ['javascript:', 'data:', 'file:', 'ftp:'];
    if (dangerousPatterns.some(pattern => body.url.toLowerCase().includes(pattern))) {
      throw new BadRequestException('URL không an toàn');
    }

    // Optional: Allow only specific domains (uncomment if needed)
    // const allowedDomains = ['trusted-domain.com', 'another-trusted-domain.com'];
    // if (!allowedDomains.includes(url.hostname)) {
    //   throw new BadRequestException('Domain không được phép');
    // }

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
    status: HttpStatus.OK,
    description: 'Upload avatar thành công',
  })
  async uploadAvatarFile(
    @CurrentUser('userId') userId: number,
    @UploadedFile() file: any,
  ): Promise<UploadFileResponseDtoType> {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file ảnh');
    }

    // Enhanced file validation using magic number detection
    const fileType = await fileTypeFromBuffer(file.buffer);
    if (!fileType) {
      throw new BadRequestException('Không thể xác định loại file ảnh');
    }

    // Validate actual file type (not just MIME type)
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedImageTypes.includes(fileType.mime)) {
      throw new BadRequestException('Chỉ chấp nhận file ảnh (JPEG, PNG, WebP, GIF)');
    }

    // Validate file extension matches actual type
    const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    if (!allowedExtensions.includes(fileExtension)) {
      throw new BadRequestException('Phần mở rộng file không hợp lệ');
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('Kích thước file không được vượt quá 5MB');
    }

    // Generate unique filename with validated extension
    const safeExtension = fileType.ext || 'jpg'; // Fallback to jpg
    const fileName = `avatars/${userId}-${Date.now()}.${safeExtension}`;

    // Upload to S3
    const uploadResult = await this.uploadService.uploadFile({
      key: fileName,
      body: file.buffer,
      contentType: fileType.mime,
    });

    if (!uploadResult.success) {
      throw new BadRequestException(
        'Lỗi khi upload ảnh: ' + uploadResult.error,
      );
    }

    // Update patient profile avatar URL
    const userData = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        patientProfiles: {
          where: { relationship: 'SELF' },
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
    status: HttpStatus.OK,
    description: 'Cập nhật avatar thành công',
  })
  async uploadAvatarUrl(
    @CurrentUser('userId') userId: number,
    @Body() body: UploadUrlDtoType,
  ): Promise<UploadFileResponseDtoType> {
    // Enhanced URL validation
    let url;
    try {
      url = new URL(body.url);
    } catch {
      throw new BadRequestException('URL không hợp lệ');
    }

    // Security checks for avatar URL
    const allowedProtocols = ['http:', 'https:'];
    if (!allowedProtocols.includes(url.protocol)) {
      throw new BadRequestException('Chỉ chấp nhận HTTP và HTTPS URLs');
    }

    // Block potentially dangerous URLs
    const dangerousPatterns = ['javascript:', 'data:', 'file:', 'ftp:'];
    if (dangerousPatterns.some(pattern => body.url.toLowerCase().includes(pattern))) {
      throw new BadRequestException('URL không an toàn');
    }

    // Validate that URL points to an image (check extension)
    const imagePath = url.pathname.toLowerCase();
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    if (!imageExtensions.some(ext => imagePath.endsWith(ext))) {
      throw new BadRequestException('URL phải trỏ đến file ảnh');
    }

    // Update patient profile avatar URL
    const userData = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        patientProfiles: {
          where: { relationship: 'SELF' },
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
