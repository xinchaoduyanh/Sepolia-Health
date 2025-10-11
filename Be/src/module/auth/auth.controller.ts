import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { TokenPayload } from '@/common/types/jwt.type';
import { AuthService } from './auth.service';
import {
  CompleteRegisterDto,
  CompleteRegisterResponseDto,
  LoginDto,
  LoginResponseDto,
  LogoutDto,
  RefreshTokenDto,
  RegisterDto,
  RegisterResponseDto,
  VerifyEmailDto,
  VerifyEmailResponseDto,
} from './auth.dto';
import { CurrentUser, Public } from '@/common/decorators';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập tài khoản' })
  @ApiResponse({
    status: 200,
    description: 'Đăng nhập thành công',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Email hoặc mật khẩu không đúng' })
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Đăng ký tài khoản mới' })
  @ApiResponse({
    status: 201,
    description: 'Đăng ký thành công, vui lòng kiểm tra email',
    type: RegisterResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Email đã được sử dụng' })
  async register(
    @Body() registerDto: RegisterDto,
  ): Promise<RegisterResponseDto> {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xác thực email với OTP' })
  @ApiResponse({
    status: 200,
    description: 'Xác thực email thành công',
    type: VerifyEmailResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Mã OTP không hợp lệ hoặc đã hết hạn',
  })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto): Promise<void> {
    return this.authService.verifyEmail(verifyEmailDto);
  }

  @Public()
  @Post('complete-register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Hoàn tất đăng ký sau khi xác thực email' })
  @ApiResponse({
    status: 201,
    description: 'Đăng ký hoàn tất thành công',
    type: CompleteRegisterResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Mã OTP không hợp lệ hoặc đã hết hạn',
  })
  async completeRegister(
    @Body() completeRegisterDto: CompleteRegisterDto,
  ): Promise<CompleteRegisterResponseDto> {
    return this.authService.completeRegister(completeRegisterDto);
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Làm mới access token' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Làm mới token thành công',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Refresh token không hợp lệ' })
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<LoginResponseDto> {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng xuất tài khoản' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Đăng xuất thành công' })
  async logout(
    @CurrentUser() user: TokenPayload,
    @Body() logoutDto: LogoutDto,
  ): Promise<void> {
    return this.authService.logout(user.userId, logoutDto.refreshToken);
  }
}
