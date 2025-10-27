import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { UserStatus } from '@prisma/client';
import { StringUtil } from '@/common/utils';
import { AuthRepository } from './auth.repository';
import { CustomJwtService, MailService, RedisService } from '@/common/modules';
import { appConfig } from '@/common/config';
import { ConfigType } from '@nestjs/config';
import { ERROR_MESSAGES } from '@/common/constants/error-messages';
import {
  getResetPasswordEmailTemplate,
  getVerifyEmailTemplate,
} from '@/common/modules/mail/templates';
import { SuccessResponseDto } from '@/common/dto';
import {
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
  RegisterResponseDto,
} from './dto/response';

// Helper function to parse date string safely
function parseDate(dateString: string): Date {
  // Try different date formats
  const formats = [
    dateString, // Original format
    dateString.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1'), // dd/mm/yyyy -> yyyy-mm-dd
    dateString.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$2/$1/$3'), // dd/mm/yyyy -> mm/dd/yyyy
  ];

  for (const format of formats) {
    const date = new Date(format);
    if (
      !isNaN(date.getTime()) &&
      date.getFullYear() > 1900 &&
      date.getFullYear() < 2100
    ) {
      return date;
    }
  }

  // Fallback to original string
  return new Date(dateString);
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtAuthService: CustomJwtService,
    private readonly mailService: MailService,
    private readonly authRepository: AuthRepository,
    private readonly redisService: RedisService,
    @Inject(appConfig.KEY)
    private readonly tokenConf: ConfigType<typeof appConfig>,
  ) {}

  /**
   * Login user
   */
  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const { email, password } = loginDto;

    const user = await this.authRepository.findByEmail(email);

    if (!user || user.password !== password) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.INVALID_CREADENTIALS);
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.USER_NOT_VERIFIED);
    }

    // Generate tokens
    const tokens = this.jwtAuthService.generateTokens({
      userId: user.id,
      role: user.role,
    });

    // Store tokens in Redis with expiration
    const accessTokenKey = `token:${user.id}:access:${Date.now()}`;
    const refreshTokenKey = `token:${user.id}:refresh:${Date.now()}`;

    // Store access token with configured expiration
    await this.redisService.setToken(
      accessTokenKey,
      tokens.accessToken,
      this.tokenConf.accessTokenExpiresInSeconds,
    );
    // Store refresh token with configured expiration
    await this.redisService.setToken(
      refreshTokenKey,
      tokens.refreshToken,
      this.tokenConf.refreshTokenExpiresInSeconds,
    );

    return tokens;
  }

  /**
   * Register user - send verification email
   */
  async register(registerDto: RegisterDto): Promise<RegisterResponseDto> {
    const { email } = registerDto;

    // Check if user already exists
    await this.authRepository.isEmailExists(email);

    // Generate OTP
    const otp = StringUtil.random(6, '0123456789');
    await this.redisService.setOtp(email, otp, 5 * 60, 'register');

    // Send OTP via email
    await this.mailService.sendEmail(getVerifyEmailTemplate({ otp, email }));

    return {
      email,
    };
  }

  async resendOtpEmail(body: RegisterDto): Promise<SuccessResponseDto> {
    const { email } = body;
    await this.authRepository.isEmailExists(email);

    const otp = StringUtil.random(6, '0123456789');
    await this.redisService.setOtp(email, otp, 5 * 60, 'register');

    await this.mailService.sendEmail(getVerifyEmailTemplate({ email, otp }));

    return new SuccessResponseDto();
  }

  /**
   * Verify email with OTP
   */
  async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<void> {
    const { email, otp } = verifyEmailDto;

    // Find OTP record
    const isOtpValid = await this.redisService.verifyOtp(
      email,
      otp,
      'register',
    );

    if (!isOtpValid) {
      throw new BadRequestException(ERROR_MESSAGES.AUTH.INVALID_OTP);
    }
  }

  /**
   * Complete registration after email verification
   */
  async completeRegister(
    completeRegisterDto: CompleteRegisterDto,
  ): Promise<CompleteRegisterResponseDto> {
    const {
      email,
      otp,
      password,
      role,
      firstName,
      lastName,
      phone,
      dateOfBirth,
      gender,
    } = completeRegisterDto;

    // Verify OTP again
    const isOtpValid = await this.redisService.verifyOtp(
      email,
      otp,
      'register',
    );

    if (!isOtpValid) {
      throw new BadRequestException(ERROR_MESSAGES.AUTH.INVALID_OTP);
    }

    // Create user with patient profile
    const userData = {
      email,
      password,
      phone, // Use phone for user.phone
      role,
      status: UserStatus.ACTIVE,
      firstName,
      lastName,
      dateOfBirth: parseDate(dateOfBirth),
      gender,
      patientPhone: phone, // Use phone for patient profile
    };

    const { user, patientProfile } =
      await this.authRepository.createUserWithPatientProfile(userData);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: patientProfile.firstName,
        lastName: patientProfile.lastName,
        role: user.role,
      },
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(
    refreshTokenDto: RefreshTokenDto,
  ): Promise<LoginResponseDto> {
    const { refreshToken } = refreshTokenDto;
    const payload = this.jwtAuthService.verifyToken(refreshToken, 'refresh');

    if (!payload.valid || !payload.payload?.userId) {
      throw new UnauthorizedException(
        ERROR_MESSAGES.AUTH.REFRESH_TOKEN_INVALID,
      );
    }

    const user = await this.authRepository.findById(payload.payload.userId);
    if (!user) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.USER_NOT_FOUND);
    }
    const tokens = this.jwtAuthService.generateTokens({
      userId: user.id,
      role: user.role,
    });

    // Store new tokens in Redis with expiration
    const accessTokenKey = `token:${user.id}:access:${Date.now()}`;
    const refreshTokenKey = `token:${user.id}:refresh:${Date.now()}`;

    // Store access token with configured expiration
    await this.redisService.setToken(
      accessTokenKey,
      tokens.accessToken,
      this.tokenConf.accessTokenExpiresInSeconds,
    );
    // Store refresh token with configured expiration
    await this.redisService.setToken(
      refreshTokenKey,
      tokens.refreshToken,
      this.tokenConf.refreshTokenExpiresInSeconds,
    );

    return tokens;
  }

  /**
   * Logout user - xóa cả access token và refresh token khỏi Redis
   */
  async logout(userId: number): Promise<void> {
    // Lấy tất cả tokens của user (cả access và refresh tokens)
    const tokens = await this.redisService.findAllTokens(userId);

    // Xóa tất cả tokens của user khỏi Redis
    await this.redisService.deleteTokens(tokens);
  }

  async forgotPassword(body: ForgotPasswordDto): Promise<SuccessResponseDto> {
    const { email } = body;
    // Check if user exists
    await this.authRepository.findByEmail(email);

    const otp = StringUtil.random();
    const expiresIn = 5 * 60;
    await this.redisService.setOtp(email, otp, expiresIn, 'reset_password');

    const resetLink = `${this.tokenConf.frontendUrl}/reset-password?email=${email}&otp=${otp}`;

    await this.mailService.sendEmail(
      getResetPasswordEmailTemplate({ resetLink, expiresIn, email }),
    );

    return new SuccessResponseDto();
  }

  // async verifyResetPasswordLink() {}

  async resetPassword(body: ResetPasswordBodyDto): Promise<SuccessResponseDto> {
    const { email, otp, newPassword } = body;

    const isOtpValid = await this.redisService.verifyOtp(
      email,
      otp,
      'reset_password',
    );

    if (!isOtpValid) {
      throw new BadRequestException(ERROR_MESSAGES.AUTH.INVALID_OTP);
    }

    const user = await this.authRepository.findByEmail(email);
    if (!user) {
      throw new BadRequestException(ERROR_MESSAGES.AUTH.USER_NOT_FOUND);
    }

    await this.authRepository.updateUser(user.id, { password: newPassword });
    // udpate redis
    await this.logout(user.id);

    // todo send mail

    return new SuccessResponseDto();
  }
}
