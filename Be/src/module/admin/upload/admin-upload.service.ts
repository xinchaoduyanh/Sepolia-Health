import { Injectable } from '@nestjs/common';
import { UploadService } from '@/common/modules/upload/upload.service';

@Injectable()
export class AdminUploadService {
  constructor(private readonly uploadService: UploadService) {}

  /**
   * Upload avatar file for admin (temporary upload for new patient creation)
   * Only uploads to S3 and returns URL, doesn't update database
   */
  async uploadAvatarFile(
    userId: number,
    file: any,
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      // Generate unique filename for admin uploads
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `admin-avatars/${userId}-${Date.now()}.${fileExtension}`;

      // Upload to S3
      const uploadResult = await this.uploadService.uploadFile({
        key: fileName,
        body: file.buffer,
        contentType: file.mimetype,
      });

      return uploadResult;
    } catch (error) {
      console.error('Admin avatar upload error:', error);
      return {
        success: false,
        error: error.message || 'Lỗi khi upload ảnh',
      };
    }
  }
}
