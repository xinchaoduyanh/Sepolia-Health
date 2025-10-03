import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import type { TokenPayload } from '@/common/types/jwt.type';
import { MESSAGES } from '@/common/constants';
import {
  LoginDto,
  RegisterDto,
  VerifyEmailDto,
  CompleteRegisterDto,
  RefreshTokenDto,
  LoginResponseDto,
  RegisterResponseDto,
  VerifyEmailResponseDto,
  CompleteRegisterResponseDto,
} from './swagger';
import { AuthService } from './auth.service';

import type {
  LoginDtoType,
  RegisterDtoType,
  VerifyEmailDtoType,
  CompleteRegisterDtoType,
  RefreshTokenDtoType,
  LoginResponseDtoType,
  RegisterResponseDtoType,
  CompleteRegisterResponseDtoType,
} from './auth.dto';
import { CurrentUser, Public } from '@/common/decorators';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập tài khoản' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Đăng nhập thành công',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Email hoặc mật khẩu không đúng' })
  // @ApiResponseOk(MESSAGES.AUTH.LOGIN_SUCCESS)
  async login(@Body() loginDto: LoginDtoType): Promise<LoginResponseDtoType> {
    return this.authService.login(loginDto);
  }

  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Đăng ký tài khoản mới' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'Đăng ký thành công, vui lòng kiểm tra email',
    type: RegisterResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Email đã được sử dụng' })
  // @ApiResponseCreated(MESSAGES.AUTH.REGISTER_SUCCESS)
  async register(
    @Body() registerDto: RegisterDtoType,
  ): Promise<RegisterResponseDtoType> {
    return this.authService.register(registerDto);
  }

  @Post('verify-email')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xác thực email với OTP' })
  @ApiBody({ type: VerifyEmailDto })
  @ApiResponse({
    status: 200,
    description: 'Xác thực email thành công',
    type: VerifyEmailResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Mã OTP không hợp lệ hoặc đã hết hạn',
  })
  // @ApiResponseOk(MESSAGES.AUTH.VERIFY_EMAIL_SUCCESS)
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDtoType): Promise<void> {
    return this.authService.verifyEmail(verifyEmailDto);
  }

  @Post('complete-register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Hoàn tất đăng ký sau khi xác thực email' })
  @ApiBody({ type: CompleteRegisterDto })
  @ApiResponse({
    status: 201,
    description: 'Đăng ký hoàn tất thành công',
    type: CompleteRegisterResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Mã OTP không hợp lệ hoặc đã hết hạn',
  })
  // @ApiResponseCreated(MESSAGES.AUTH.VERIFY_EMAIL_SUCCESS)
  async completeRegister(
    @Body() completeRegisterDto: CompleteRegisterDtoType,
  ): Promise<CompleteRegisterResponseDtoType> {
    return this.authService.completeRegister(completeRegisterDto);
  }

  @Post('refresh-token')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Làm mới access token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Làm mới token thành công',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Refresh token không hợp lệ' })
  // @ApiResponseOk(MESSAGES.AUTH.REFRESH_TOKEN_SUCCESS)
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDtoType,
  ): Promise<LoginResponseDtoType> {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng xuất tài khoản' })
  @ApiResponse({ status: 200, description: 'Đăng xuất thành công' })
  // @ApiResponseOk(MESSAGES.AUTH.LOGOUT_SUCCESS)
  async logout(@CurrentUser() user: TokenPayload): Promise<void> {
    return this.authService.logout(user.userId);
  }
}
