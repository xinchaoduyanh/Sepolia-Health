import { Injectable, BadRequestException } from '@nestjs/common';
import { UserRepository } from './user.repository';
import {
  UpdateUserProfileDtoType,
  UserProfileWithPatientProfilesResponseDtoType,
  UpdateUserProfileResponseDtoType,
  UploadAvatarResponseDtoType,
  PatientProfilesResponseDtoType,
  CreatePatientProfileDtoType,
  UpdatePatientProfileDtoType,
  CreatePatientProfileResponseDtoType,
  UpdatePatientProfileResponseDtoType,
  DeletePatientProfileResponseDtoType,
} from './user.dto';
import { UploadService } from '@/common/modules';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly uploadService: UploadService,
  ) {}

  /**
   * Get user profile
   */
  async getProfile(
    userId: number,
  ): Promise<UserProfileWithPatientProfilesResponseDtoType> {
    const user = await this.userRepository.findUserById(userId);

    // Get profile based on role
    let profile: any = null;
    if (user.role === 'DOCTOR' && user.doctorProfile) {
      profile = user.doctorProfile;
    } else if (user.role === 'RECEPTIONIST' && user.receptionistProfile) {
      profile = user.receptionistProfile;
    } else if (user.role === 'PATIENT' && user.patientProfiles.length > 0) {
      profile = user.patientProfiles[0];
    }

    // Format patient profiles
    const formattedPatientProfiles = user.patientProfiles.map(
      (patientProfile) => ({
        id: patientProfile.id,
        firstName: patientProfile.firstName,
        lastName: patientProfile.lastName,
        dateOfBirth: patientProfile.dateOfBirth.toISOString(),
        gender: patientProfile.gender,
        phone: patientProfile.phone,
        relationship: patientProfile.relationship,
        avatar: patientProfile.avatar,
        idCardNumber: patientProfile.idCardNumber,
        occupation: patientProfile.occupation,
        nationality: patientProfile.nationality,
        address: patientProfile.address,
        healthDetailsJson: patientProfile.healthDetailsJson,
        createdAt: patientProfile.createdAt.toISOString(),
        updatedAt: patientProfile.updatedAt.toISOString(),
      }),
    );

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
      status: user.status,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      patientProfiles: formattedPatientProfiles,
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: number,
    updateData: UpdateUserProfileDtoType,
  ): Promise<UpdateUserProfileResponseDtoType> {
    const user = await this.userRepository.findUserById(userId);

    // Update user phone if provided
    if (updateData.phone) {
      await this.userRepository.updateUser(userId, { phone: updateData.phone });
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

      updatedProfile = await this.userRepository.updateDoctorProfile(
        user.doctorProfile.id,
        profileUpdateData,
      );
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

      updatedProfile = await this.userRepository.updateReceptionistProfile(
        user.receptionistProfile.id,
        profileUpdateData,
      );
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

      updatedProfile = await this.userRepository.updatePatientProfileForAvatar(
        user.patientProfiles[0].id,
        profileUpdateData,
      );
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
        status: user.status,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    };
  }

  /**
   * Upload avatar
   */
  async uploadAvatar(
    userId: number,
    file: any,
  ): Promise<UploadAvatarResponseDtoType> {
    await this.userRepository.findUserByIdSimple(userId);

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
    const userData = await this.userRepository.findUserById(userId);

    if (userData?.role === 'DOCTOR' && userData.doctorProfile) {
      await this.userRepository.updateDoctorProfile(userData.doctorProfile.id, {
        avatar: uploadResult.url,
      });
    } else if (
      userData?.role === 'RECEPTIONIST' &&
      userData.receptionistProfile
    ) {
      await this.userRepository.updateReceptionistProfile(
        userData.receptionistProfile.id,
        { avatar: uploadResult.url },
      );
    } else if (
      userData?.role === 'PATIENT' &&
      userData.patientProfiles.length > 0
    ) {
      await this.userRepository.updatePatientProfileForAvatar(
        userData.patientProfiles[0].id,
        { avatar: uploadResult.url },
      );
    }

    return {
      avatarUrl: uploadResult.url!,
    };
  }

  /**
   * Upload avatar for specific patient profile
   */
  async uploadPatientProfileAvatar(
    userId: number,
    profileId: number,
    file: any,
  ): Promise<UploadAvatarResponseDtoType> {
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

    // Check if patient profile exists and belongs to user
    const profile =
      await this.userRepository.findPatientProfileByIdAndManagerId(
        profileId,
        userId,
      );

    // Generate unique filename
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `patient-avatars/${userId}-${profileId}-${Date.now()}.${fileExtension}`;

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

    // Update patient profile avatar
    await this.userRepository.updatePatientProfile(profileId, {
      avatar: uploadResult.url,
    });

    return {
      avatarUrl: uploadResult.url!,
    };
  }

  /**
   * Get all patient profiles for a user
   */
  async getPatientProfiles(
    userId: number,
  ): Promise<PatientProfilesResponseDtoType> {
    await this.userRepository.findUserByIdSimple(userId);

    const patientProfiles =
      await this.userRepository.getPatientProfiles(userId);

    // DEBUG LOG: Log userId and number of profiles found
    console.log(`[DEBUG] getPatientProfiles - userId: ${userId}, found ${patientProfiles.length} profiles`);
    console.log(`[DEBUG] Profile IDs:`, patientProfiles.map(p => ({ id: p.id, firstName: p.firstName, lastName: p.lastName, managerId: p.managerId })));

    return {
      profiles: patientProfiles.map((profile) => ({
        id: profile.id,
        firstName: profile.firstName,
        lastName: profile.lastName,
        dateOfBirth: profile.dateOfBirth.toISOString(),
        gender: profile.gender,
        phone: profile.phone,
        relationship: profile.relationship,
        avatar: profile.avatar,
        idCardNumber: profile.idCardNumber,
        occupation: profile.occupation,
        nationality: profile.nationality,
        address: profile.address,
        healthDetailsJson: profile.healthDetailsJson,
        createdAt: profile.createdAt.toISOString(),
        updatedAt: profile.updatedAt.toISOString(),
      })),
    };
  }

  /**
   * Create a new patient profile
   */
  async createPatientProfile(
    userId: number,
    createData: CreatePatientProfileDtoType,
  ): Promise<CreatePatientProfileResponseDtoType> {
    await this.userRepository.findUserByIdSimple(userId);

    const patientProfile = await this.userRepository.createPatientProfile({
      firstName: createData.firstName,
      lastName: createData.lastName,
      dateOfBirth: new Date(createData.dateOfBirth),
      gender: createData.gender,
      phone: createData.phone,
      relationship: createData.relationship,
      avatar: createData.avatar,
      idCardNumber: createData.idCardNumber,
      occupation: createData.occupation,
      nationality: createData.nationality,
      address: createData.address,
      healthDetailsJson: createData.healthDetailsJson,
      managerId: userId,
    });

    return {
      profile: {
        id: patientProfile.id,
        firstName: patientProfile.firstName,
        lastName: patientProfile.lastName,
        dateOfBirth: patientProfile.dateOfBirth.toISOString(),
        gender: patientProfile.gender,
        phone: patientProfile.phone,
        relationship: patientProfile.relationship,
        avatar: patientProfile.avatar,
        idCardNumber: patientProfile.idCardNumber,
        occupation: patientProfile.occupation,
        nationality: patientProfile.nationality,
        address: patientProfile.address,
        healthDetailsJson: patientProfile.healthDetailsJson,
        createdAt: patientProfile.createdAt.toISOString(),
        updatedAt: patientProfile.updatedAt.toISOString(),
      },
    };
  }

  /**
   * Update a patient profile
   */
  async updatePatientProfile(
    userId: number,
    profileId: number,
    updateData: UpdatePatientProfileDtoType,
  ): Promise<UpdatePatientProfileResponseDtoType> {
    await this.userRepository.findUserByIdSimple(userId);

    // Check if profile exists and belongs to user
    await this.userRepository.findPatientProfileByIdAndManagerId(
      profileId,
      userId,
    );

    // If setting as primary, unset other primary profiles
    // Check if this is a SELF relationship profile
    const isSelfProfile = updateData.relationship === 'SELF';

    const updateDataFormatted: any = {};
    if (updateData.firstName)
      updateDataFormatted.firstName = updateData.firstName;
    if (updateData.lastName) updateDataFormatted.lastName = updateData.lastName;
    if (updateData.dateOfBirth)
      updateDataFormatted.dateOfBirth = new Date(updateData.dateOfBirth);
    if (updateData.gender) updateDataFormatted.gender = updateData.gender;
    if (updateData.phone) updateDataFormatted.phone = updateData.phone;
    if (updateData.relationship)
      updateDataFormatted.relationship = updateData.relationship;
    if (updateData.avatar !== undefined)
      updateDataFormatted.avatar = updateData.avatar;
    if (updateData.idCardNumber !== undefined)
      updateDataFormatted.idCardNumber = updateData.idCardNumber;
    if (updateData.occupation !== undefined)
      updateDataFormatted.occupation = updateData.occupation;
    if (updateData.nationality !== undefined)
      updateDataFormatted.nationality = updateData.nationality;
    if (updateData.address !== undefined)
      updateDataFormatted.address = updateData.address;
    if (updateData.healthDetailsJson !== undefined)
      updateDataFormatted.healthDetailsJson = updateData.healthDetailsJson;

    const updatedProfile = await this.userRepository.updatePatientProfile(
      profileId,
      updateDataFormatted,
    );

    return {
      profile: {
        id: updatedProfile.id,
        firstName: updatedProfile.firstName,
        lastName: updatedProfile.lastName,
        dateOfBirth: updatedProfile.dateOfBirth.toISOString(),
        gender: updatedProfile.gender,
        phone: updatedProfile.phone,
        relationship: updatedProfile.relationship,
        avatar: updatedProfile.avatar,
        idCardNumber: updatedProfile.idCardNumber,
        occupation: updatedProfile.occupation,
        nationality: updatedProfile.nationality,
        address: updatedProfile.address,
        healthDetailsJson: updatedProfile.healthDetailsJson,
        createdAt: updatedProfile.createdAt.toISOString(),
        updatedAt: updatedProfile.updatedAt.toISOString(),
      },
    };
  }

  /**
   * Delete a patient profile
   */
  async deletePatientProfile(
    userId: number,
    profileId: number,
  ): Promise<DeletePatientProfileResponseDtoType> {
    await this.userRepository.findUserByIdSimple(userId);

    // Check if profile exists and belongs to user
    await this.userRepository.findPatientProfileByIdAndManagerId(
      profileId,
      userId,
    );

    // Check if there are any appointments with this profile
    const appointmentsCount =
      await this.userRepository.countAppointmentsForProfile(profileId);

    if (appointmentsCount > 0) {
      throw new BadRequestException(
        'Không thể xóa hồ sơ bệnh nhân đã có lịch hẹn. Vui lòng liên hệ quản trị viên.',
      );
    }

    await this.userRepository.deletePatientProfile(profileId);

    return {};
  }
}
