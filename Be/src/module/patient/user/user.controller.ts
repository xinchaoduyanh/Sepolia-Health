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
} from '@nestjs/swagger';
import { UserService } from './user.service';
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
  UserProfileWithPatientProfilesResponseDto,
  UpdateUserProfileResponseDto,
  PatientProfilesResponseDto,
  CreatePatientProfileResponseDto,
  UpdatePatientProfileResponseDto,
  DeletePatientProfileResponseDto,
} from './user.dto';
import { CurrentUser } from '@/common/decorators';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('Patient Profile')
@Controller('patient/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Lấy thông tin cá nhân' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy thông tin thành công',
    type: UserProfileWithPatientProfilesResponseDto,
  })
  async getProfile(
    @CurrentUser('userId') userId: number,
  ): Promise<UserProfileWithPatientProfilesResponseDtoType> {
    return this.userService.getProfile(userId);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Cập nhật thông tin cá nhân' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cập nhật thành công',
    type: UpdateUserProfileResponseDto,
  })
  async updateProfile(
    @CurrentUser('userId') userId: number,
    @Body() updateData: UpdateUserProfileDtoType,
  ): Promise<UpdateUserProfileResponseDtoType> {
    return this.userService.updateProfile(userId, updateData);
  }

  @Post('upload-avatar')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiOperation({ summary: 'Upload ảnh đại diện' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Upload ảnh thành công',
  })
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
  @ApiOperation({ summary: 'Lấy danh sách hồ sơ bệnh nhân của người dùng' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy danh sách hồ sơ bệnh nhân thành công',
    type: PatientProfilesResponseDto,
  })
  async getPatientProfiles(
    @CurrentUser('userId') userId: number,
  ): Promise<PatientProfilesResponseDtoType> {
    return this.userService.getPatientProfiles(userId);
  }

  @Post('patient-profiles')
  @ApiOperation({ summary: 'Tạo hồ sơ bệnh nhân mới' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tạo hồ sơ bệnh nhân thành công',
    type: CreatePatientProfileResponseDto,
  })
  async createPatientProfile(
    @CurrentUser('userId') userId: number,
    @Body() createData: CreatePatientProfileDtoType,
  ): Promise<CreatePatientProfileResponseDtoType> {
    return this.userService.createPatientProfile(userId, createData);
  }

  @Put('patient-profiles/:profileId')
  @ApiOperation({ summary: 'Cập nhật hồ sơ bệnh nhân' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cập nhật hồ sơ bệnh nhân thành công',
    type: UpdatePatientProfileResponseDto,
  })
  async updatePatientProfile(
    @CurrentUser('userId') userId: number,
    @Param('profileId', ParseIntPipe) profileId: number,
    @Body() updateData: UpdatePatientProfileDtoType,
  ): Promise<UpdatePatientProfileResponseDtoType> {
    return this.userService.updatePatientProfile(userId, profileId, updateData);
  }

  @Post('patient-profiles/:profileId/upload-avatar')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiOperation({ summary: 'Upload ảnh đại diện cho hồ sơ bệnh nhân' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Upload ảnh thành công',
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
    status: HttpStatus.OK,
    description: 'Xóa hồ sơ bệnh nhân thành công',
    type: DeletePatientProfileResponseDto,
  })
  async deletePatientProfile(
    @CurrentUser('userId') userId: number,
    @Param('profileId', ParseIntPipe) profileId: number,
  ): Promise<DeletePatientProfileResponseDtoType> {
    return this.userService.deletePatientProfile(userId, profileId);
  }
}
