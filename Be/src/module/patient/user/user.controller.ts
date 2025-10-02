import {
  Controller,
  Get,
  Put,
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
import { CurrentUser, ApiResponseOk, CustomZodValidationPipe } from '@/common';
import type { TokenPayload } from '@/common/types/jwt.type';
import { MESSAGES } from '@/common/constants';
import { UserService } from './user.service';
import type {
  UpdateUserProfileDtoType,
  ChangePasswordDtoType,
  UserProfileResponseDtoType,
  UpdateUserProfileResponseDtoType,
  ChangePasswordResponseDtoType,
  UploadAvatarResponseDtoType,
} from './user.dto';
import { UpdateUserProfileDto, ChangePasswordDto } from './user.dto';

@ApiTags('User Profile')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy thông tin cá nhân' })
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin thành công',
  })
  @ApiResponseOk(MESSAGES.USER.GET_PROFILE_SUCCESS)
  async getProfile(
    @CurrentUser() user: TokenPayload,
  ): Promise<UserProfileResponseDtoType> {
    return this.userService.getProfile(user.userId);
  }

  @Put('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cập nhật thông tin cá nhân' })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật thành công',
  })
  @ApiResponseOk(MESSAGES.USER.UPDATE_PROFILE_SUCCESS)
  async updateProfile(
    @CurrentUser() user: TokenPayload,
    @Body(new CustomZodValidationPipe(UpdateUserProfileDto))
    updateData: UpdateUserProfileDtoType,
  ): Promise<UpdateUserProfileResponseDtoType> {
    return this.userService.updateProfile(user.userId, updateData);
  }

  @Put('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đổi mật khẩu' })
  @ApiResponse({
    status: 200,
    description: 'Đổi mật khẩu thành công',
  })
  @ApiResponseOk(MESSAGES.USER.CHANGE_PASSWORD_SUCCESS)
  async changePassword(
    @CurrentUser() user: TokenPayload,
    @Body(new CustomZodValidationPipe(ChangePasswordDto))
    changePasswordData: ChangePasswordDtoType,
  ): Promise<ChangePasswordResponseDtoType> {
    return this.userService.changePassword(user.userId, changePasswordData);
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
  @ApiResponseOk('Upload ảnh đại diện thành công')
  async uploadAvatar(
    @CurrentUser() user: TokenPayload,
    @UploadedFile() file: any,
  ): Promise<UploadAvatarResponseDtoType> {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file ảnh');
    }
    return this.userService.uploadAvatar(user.userId, file);
  }
}
