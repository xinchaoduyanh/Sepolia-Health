import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import {
  UpdateUserProfileDtoType,
  ChangePasswordDtoType,
  UserProfileResponseDtoType,
  UpdateUserProfileResponseDtoType,
  ChangePasswordResponseDtoType,
  UploadAvatarResponseDtoType,
} from './user.dto';
import { UploadService } from '@/common/modules';
import { ERROR_MESSAGES } from '@/common/constants/error-messages';

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
      include: {
        doctorProfile: true,
        receptionistProfile: true,
        patientProfiles: {
          where: { isPrimary: true },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.AUTH.USER_NOT_FOUND);
    }

    // Get profile based on role
    let profile: any = null;
    if (user.role === 'DOCTOR' && user.doctorProfile) {
      profile = user.doctorProfile;
    } else if (user.role === 'RECEPTIONIST' && user.receptionistProfile) {
      profile = user.receptionistProfile;
    } else if (user.role === 'PATIENT' && user.patientProfiles.length > 0) {
      profile = user.patientProfiles[0];
    }

    return {
      id: user.id,
      email: user.email,
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      phone: user.phone || profile?.phone || '',
      address: profile?.address || '',
      dateOfBirth: profile?.dateOfBirth?.toISOString() || null,
      gender: profile?.gender || '',
      avatar: profile?.avatar || '',
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
      include: {
        doctorProfile: true,
        receptionistProfile: true,
        patientProfiles: {
          where: { isPrimary: true },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.AUTH.USER_NOT_FOUND);
    }

    // Update user phone if provided
    if (updateData.phone) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { phone: updateData.phone },
      });
    }

    // Update profile based on role
    let updatedProfile: any = null;
    if (user.role === 'DOCTOR' && user.doctorProfile) {
      const profileUpdateData: any = {};
      if (updateData.firstName)
        profileUpdateData.firstName = updateData.firstName;
      if (updateData.lastName) profileUpdateData.lastName = updateData.lastName;
      if (updateData.address !== undefined)
        profileUpdateData.address = updateData.address;
      if (updateData.gender) profileUpdateData.gender = updateData.gender;
      if (updateData.avatar) profileUpdateData.avatar = updateData.avatar;
      if (updateData.dateOfBirth) {
        profileUpdateData.dateOfBirth = new Date(updateData.dateOfBirth);
      }

      updatedProfile = await this.prisma.doctorProfile.update({
        where: { id: user.doctorProfile.id },
        data: profileUpdateData,
      });
    } else if (user.role === 'RECEPTIONIST' && user.receptionistProfile) {
      const profileUpdateData: any = {};
      if (updateData.firstName)
        profileUpdateData.firstName = updateData.firstName;
      if (updateData.lastName) profileUpdateData.lastName = updateData.lastName;
      if (updateData.address !== undefined)
        profileUpdateData.address = updateData.address;
      if (updateData.gender) profileUpdateData.gender = updateData.gender;
      if (updateData.avatar) profileUpdateData.avatar = updateData.avatar;
      if (updateData.dateOfBirth) {
        profileUpdateData.dateOfBirth = new Date(updateData.dateOfBirth);
      }

      updatedProfile = await this.prisma.receptionistProfile.update({
        where: { id: user.receptionistProfile.id },
        data: profileUpdateData,
      });
    } else if (user.role === 'PATIENT' && user.patientProfiles.length > 0) {
      const profileUpdateData: any = {};
      if (updateData.firstName)
        profileUpdateData.firstName = updateData.firstName;
      if (updateData.lastName) profileUpdateData.lastName = updateData.lastName;
      if (updateData.address !== undefined)
        profileUpdateData.address = updateData.address;
      if (updateData.gender) profileUpdateData.gender = updateData.gender;
      if (updateData.avatar) profileUpdateData.avatar = updateData.avatar;
      if (updateData.dateOfBirth) {
        profileUpdateData.dateOfBirth = new Date(updateData.dateOfBirth);
      }

      updatedProfile = await this.prisma.patientProfile.update({
        where: { id: user.patientProfiles[0].id },
        data: profileUpdateData,
      });
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: updatedProfile?.firstName || '',
        lastName: updatedProfile?.lastName || '',
        phone: updateData.phone || user.phone || updatedProfile?.phone || '',
        address: updatedProfile?.address || '',
        dateOfBirth: updatedProfile?.dateOfBirth?.toISOString() || null,
        gender: updatedProfile?.gender || '',
        avatar: updatedProfile?.avatar || '',
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
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

    // Update profile avatar URL based on role
    const userData = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        doctorProfile: true,
        receptionistProfile: true,
        patientProfiles: {
          where: { isPrimary: true },
          take: 1,
        },
      },
    });

    if (userData?.role === 'DOCTOR' && userData.doctorProfile) {
      await this.prisma.doctorProfile.update({
        where: { id: userData.doctorProfile.id },
        data: { avatar: uploadResult.url },
      });
    } else if (
      userData?.role === 'RECEPTIONIST' &&
      userData.receptionistProfile
    ) {
      await this.prisma.receptionistProfile.update({
        where: { id: userData.receptionistProfile.id },
        data: { avatar: uploadResult.url },
      });
    } else if (
      userData?.role === 'PATIENT' &&
      userData.patientProfiles.length > 0
    ) {
      await this.prisma.patientProfile.update({
        where: { id: userData.patientProfiles[0].id },
        data: { avatar: uploadResult.url },
      });
    }

    return {
      avatarUrl: uploadResult.url!,
    };
  }
}
