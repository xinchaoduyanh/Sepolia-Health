import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CurrentUser, Public } from '@/common/decorators';
import { SuccessResponseDto } from '@/common/dto';
import {
  ChangePasswordDto,
  CompleteRegisterDto,
  ForgotPasswordDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
  ResetPasswordBodyDto,
  VerifyEmailDto,
} from './dto/request';
import {
  CompleteRegisterResponseDto,
  LoginResponseDto,
  MeResponseDto,
  RegisterResponseDto,
} from './dto/response';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập tài khoản' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Email hoặc mật khẩu không đúng',
  })
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Đăng ký tài khoản mới' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: RegisterResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email đã được sử dụng',
  })
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
    status: HttpStatus.OK,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
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
    status: HttpStatus.CREATED,
    type: CompleteRegisterResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
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
    status: HttpStatus.OK,
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Refresh token không hợp lệ',
  })
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<LoginResponseDto> {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng xuất tài khoản' })
  @ApiBearerAuth()
  @ApiResponse({ status: HttpStatus.OK, description: 'Đăng xuất thành công' })
  async logout(@CurrentUser('userId') userId: number): Promise<void> {
    return this.authService.logout(userId);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Quên mật khẩu - Gửi OTP về email' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SuccessResponseDto,
  })
  async forgotPassword(
    @Body() body: ForgotPasswordDto,
  ): Promise<SuccessResponseDto> {
    return this.authService.forgotPassword(body);
  }

  @Public()
  @Post('verify-forgot-password-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xác thực OTP cho quên mật khẩu' })
  @ApiResponse({
    status: HttpStatus.OK,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Mã OTP không hợp lệ hoặc đã hết hạn',
  })
  async verifyForgotPasswordOtp(
    @Body() verifyEmailDto: VerifyEmailDto,
  ): Promise<void> {
    return this.authService.verifyForgotPasswordOtp(verifyEmailDto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đặt lại mật khẩu sau khi xác thực OTP' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SuccessResponseDto,
  })
  async resetPassword(
    @Body() body: ResetPasswordBodyDto,
  ): Promise<SuccessResponseDto> {
    return this.authService.resetPassword(body);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Đổi mật khẩu' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SuccessResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Mật khẩu cũ không đúng hoặc chưa đăng nhập',
  })
  async changePassword(
    @CurrentUser('userId') userId: number,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<SuccessResponseDto> {
    await this.authService.changePassword(userId, changePasswordDto);
    return new SuccessResponseDto();
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thông tin profile hiện tại' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: MeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Chưa đăng nhập',
  })
  async getMe(@CurrentUser('userId') userId: number): Promise<MeResponseDto> {
    return this.authService.getMe(userId);
  }
}
