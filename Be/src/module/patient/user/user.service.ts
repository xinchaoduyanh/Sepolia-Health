import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { UploadService } from '@/common';
import { ERROR_MESSAGES } from '@/common/constants/messages';
import {
  UpdateUserProfileDtoType,
  ChangePasswordDtoType,
  UserProfileResponseDtoType,
  UpdateUserProfileResponseDtoType,
  ChangePasswordResponseDtoType,
  UploadAvatarResponseDtoType,
} from './user.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
  ) {}

  /**
   * Get user profile
   */
  async getProfile(userId: number): Promise<UserProfileResponseDtoType> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.AUTH.USER_NOT_FOUND);
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      address: user.address,
      dateOfBirth: user.dateOfBirth?.toISOString() || null,
      gender: user.gender,
      avatar: user.avatar,
      role: user.role,
      isVerified: user.isVerified,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: number,
    updateData: UpdateUserProfileDtoType,
  ): Promise<UpdateUserProfileResponseDtoType> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.AUTH.USER_NOT_FOUND);
    }

    // Prepare update data
    const updatePayload: any = {};

    if (updateData.firstName) updatePayload.firstName = updateData.firstName;
    if (updateData.lastName) updatePayload.lastName = updateData.lastName;
    if (updateData.phone) updatePayload.phone = updateData.phone;
    if (updateData.address !== undefined)
      updatePayload.address = updateData.address;
    if (updateData.gender) updatePayload.gender = updateData.gender;
    if (updateData.dateOfBirth) {
      updatePayload.dateOfBirth = new Date(updateData.dateOfBirth);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updatePayload,
    });

    return {
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phone: updatedUser.phone,
        address: updatedUser.address,
        dateOfBirth: updatedUser.dateOfBirth?.toISOString() || null,
        gender: updatedUser.gender,
        avatar: updatedUser.avatar,
        role: updatedUser.role,
        isVerified: updatedUser.isVerified,
        createdAt: updatedUser.createdAt.toISOString(),
        updatedAt: updatedUser.updatedAt.toISOString(),
      },
    };
  }

  /**
   * Change password
   */
  async changePassword(
    userId: number,
    changePasswordData: ChangePasswordDtoType,
  ): Promise<ChangePasswordResponseDtoType> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.AUTH.USER_NOT_FOUND);
    }

    // Verify current password
    if (user.password !== changePasswordData.currentPassword) {
      throw new UnauthorizedException('Mật khẩu hiện tại không đúng');
    }

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: changePasswordData.newPassword },
    });

    return {
      message: 'Đổi mật khẩu thành công',
    };
  }

  /**
   * Upload avatar
   */
  async uploadAvatar(
    userId: number,
    file: any,
  ): Promise<UploadAvatarResponseDtoType> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.AUTH.USER_NOT_FOUND);
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
    const fileName = `avatars/${userId}-${Date.now()}.${fileExtension}`;

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
      where: { id: userId },
      data: { avatar: uploadResult.url },
    });

    return {
      avatarUrl: uploadResult.url!,
    };
  }
}
