import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  BadRequestException,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import type {
  UpdateUserProfileDtoType,
  ChangePasswordDtoType,
  UserProfileWithPatientProfilesResponseDtoType,
  UpdateUserProfileResponseDtoType,
  ChangePasswordResponseDtoType,
  UploadAvatarResponseDtoType,
  PatientProfilesResponseDtoType,
  CreatePatientProfileDtoType,
  UpdatePatientProfileDtoType,
  CreatePatientProfileResponseDtoType,
  UpdatePatientProfileResponseDtoType,
  DeletePatientProfileResponseDtoType,
} from './user.dto';
import {
  UpdateUserProfileDto,
  ChangePasswordDto,
  UpdateUserProfileSchema,
  ChangePasswordSchema,
  UserProfileWithPatientProfilesResponseDto,
  UpdateUserProfileResponseDto,
  ChangePasswordResponseDto,
  PatientProfilesResponseDto,
  CreatePatientProfileDto,
  UpdatePatientProfileDto,
  CreatePatientProfileSchema,
  UpdatePatientProfileSchema,
  CreatePatientProfileResponseDto,
  UpdatePatientProfileResponseDto,
  DeletePatientProfileResponseDto,
} from './user.dto';
import { CurrentUser } from '@/common/decorators';
import { CustomZodValidationPipe } from '@/common/pipes';
import { ApiBearerAuth } from '@nestjs/swagger';
@ApiBearerAuth()
@ApiTags('Patient Profile')
@Controller('patient/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy thông tin cá nhân' })
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin thành công',
    type: UserProfileWithPatientProfilesResponseDto,
  })
  // @ApiResponseOk(MESSAGES.USER.GET_PROFILE_SUCCESS)
  async getProfile(
    @CurrentUser('userId') userId: number,
  ): Promise<UserProfileWithPatientProfilesResponseDtoType> {
    return this.userService.getProfile(userId);
  }

  @Put('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cập nhật thông tin cá nhân' })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật thành công',
    type: UpdateUserProfileResponseDto,
  })
  @ApiResponse({
    status: 422,
    description: 'Dữ liệu không hợp lệ',
  })
  @ApiBody({
    type: UpdateUserProfileDto,
    description: 'Thông tin cập nhật',
    examples: {
      example1: {
        summary: 'Cập nhật thông tin cơ bản',
        value: {
          firstName: 'Nguyễn',
          lastName: 'Văn A',
          phone: '0123456789',
          address: '123 Đường ABC, Quận 1, TP.HCM',
          dateOfBirth: '1990-01-15T00:00:00.000Z',
          gender: 'MALE',
        },
      },
    },
  })
  async updateProfile(
    @CurrentUser('userId') userId: number,
    @Body(new CustomZodValidationPipe(UpdateUserProfileSchema))
    updateData: UpdateUserProfileDtoType,
  ): Promise<UpdateUserProfileResponseDtoType> {
    return this.userService.updateProfile(userId, updateData);
  }

  @Put('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đổi mật khẩu' })
  @ApiResponse({
    status: 200,
    description: 'Đổi mật khẩu thành công',
    type: ChangePasswordResponseDto,
  })
  @ApiResponse({
    status: 422,
    description: 'Dữ liệu không hợp lệ',
  })
  @ApiBody({
    type: ChangePasswordDto,
    description: 'Thông tin đổi mật khẩu',
    examples: {
      example1: {
        summary: 'Đổi mật khẩu',
        value: {
          currentPassword: 'oldpassword123',
          newPassword: 'newpassword123',
          confirmPassword: 'newpassword123',
        },
      },
    },
  })
  async changePassword(
    @CurrentUser('userId') userId: number,
    @Body(new CustomZodValidationPipe(ChangePasswordSchema))
    changePasswordData: ChangePasswordDtoType,
  ): Promise<ChangePasswordResponseDtoType> {
    return this.userService.changePassword(userId, changePasswordData);
  }

  @Post('upload-avatar')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiOperation({ summary: 'Upload ảnh đại diện' })
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
    description: 'Upload ảnh thành công',
  })
  // @ApiResponseOk('Upload ảnh đại diện thành công')
  async uploadAvatar(
    @CurrentUser('userId') userId: number,
    @UploadedFile() file: any,
  ): Promise<UploadAvatarResponseDtoType> {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file ảnh');
    }
    return this.userService.uploadAvatar(userId, file);
  }

  @Get('patient-profiles')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy danh sách hồ sơ bệnh nhân của người dùng' })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách hồ sơ bệnh nhân thành công',
    type: PatientProfilesResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy người dùng',
  })
  async getPatientProfiles(
    @CurrentUser('userId') userId: number,
  ): Promise<PatientProfilesResponseDtoType> {
    return this.userService.getPatientProfiles(userId);
  }

  @Post('patient-profiles')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo hồ sơ bệnh nhân mới' })
  @ApiResponse({
    status: 201,
    description: 'Tạo hồ sơ bệnh nhân thành công',
    type: CreatePatientProfileResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dữ liệu không hợp lệ',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy người dùng',
  })
  @ApiBody({
    type: CreatePatientProfileDto,
    description: 'Thông tin hồ sơ bệnh nhân mới',
    examples: {
      example1: {
        summary: 'Tạo hồ sơ bệnh nhân cho con',
        value: {
          firstName: 'Nguyễn',
          lastName: 'Văn B',
          dateOfBirth: '2010-05-15T00:00:00.000Z',
          gender: 'MALE',
          phone: '0987654321',
          relationship: 'CHILD',
          address: '123 Đường ABC, Quận 1, TP.HCM',
        },
      },
    },
  })
  async createPatientProfile(
    @CurrentUser('userId') userId: number,
    @Body(new CustomZodValidationPipe(CreatePatientProfileSchema))
    createData: CreatePatientProfileDtoType,
  ): Promise<CreatePatientProfileResponseDtoType> {
    return this.userService.createPatientProfile(userId, createData);
  }

  @Put('patient-profiles/:profileId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cập nhật hồ sơ bệnh nhân' })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật hồ sơ bệnh nhân thành công',
    type: UpdatePatientProfileResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dữ liệu không hợp lệ',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy hồ sơ bệnh nhân',
  })
  @ApiBody({
    type: UpdatePatientProfileDto,
    description: 'Thông tin cập nhật hồ sơ bệnh nhân',
    examples: {
      example1: {
        summary: 'Cập nhật thông tin hồ sơ bệnh nhân',
        value: {
          firstName: 'Nguyễn',
          lastName: 'Văn C',
          address: '456 Đường XYZ, Quận 2, TP.HCM',
          occupation: 'Học sinh',
        },
      },
    },
  })
  async updatePatientProfile(
    @CurrentUser('userId') userId: number,
    @Param('profileId', ParseIntPipe) profileId: number,
    @Body(new CustomZodValidationPipe(UpdatePatientProfileSchema))
    updateData: UpdatePatientProfileDtoType,
  ): Promise<UpdatePatientProfileResponseDtoType> {
    return this.userService.updatePatientProfile(userId, profileId, updateData);
  }

  @Post('patient-profiles/:profileId/upload-avatar')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiOperation({ summary: 'Upload ảnh đại diện cho hồ sơ bệnh nhân' })
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
    description: 'Upload ảnh thành công',
  })
  @ApiResponse({
    status: 400,
    description: 'Dữ liệu không hợp lệ',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy hồ sơ bệnh nhân',
  })
  async uploadPatientProfileAvatar(
    @CurrentUser('userId') userId: number,
    @Param('profileId', ParseIntPipe) profileId: number,
    @UploadedFile() file: any,
  ): Promise<UploadAvatarResponseDtoType> {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file ảnh');
    }
    return this.userService.uploadPatientProfileAvatar(userId, profileId, file);
  }

  @Delete('patient-profiles/:profileId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa hồ sơ bệnh nhân' })
  @ApiResponse({
    status: 200,
    description: 'Xóa hồ sơ bệnh nhân thành công',
    type: DeletePatientProfileResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Không thể xóa hồ sơ bệnh nhân đã có lịch hẹn',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy hồ sơ bệnh nhân',
  })
  async deletePatientProfile(
    @CurrentUser('userId') userId: number,
    @Param('profileId', ParseIntPipe) profileId: number,
  ): Promise<DeletePatientProfileResponseDtoType> {
    return this.userService.deletePatientProfile(userId, profileId);
  }
}
