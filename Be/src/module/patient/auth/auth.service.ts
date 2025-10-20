import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { UserStatus } from '@prisma/client';
import { StringUtil } from '@/common/utils';
import {
  CompleteRegisterDto,
  CompleteRegisterResponseDto,
  LoginDto,
  LoginResponseDto,
  RefreshTokenDto,
  RegisterDto,
  RegisterResponseDto,
  VerifyEmailDto,
} from './auth.dto';
import { AuthRepository } from './auth.repository';
import { CustomJwtService, MailService, RedisService } from '@/common/modules';
import { appConfig } from '@/common/config';
import { ConfigType } from '@nestjs/config';
import { ERROR_MESSAGES } from '@/common/constants/error-messages';
import { getVerifyEmailTemplate } from '@/common/modules/mail/templates';

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

    if (!user) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.INVALID_PASSWORD);
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.USER_NOT_VERIFIED);
    }

    if (user.password !== password) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.INVALID_PASSWORD);
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

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
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
    console.log('OTP:', otp);

    // Send OTP via email
    await this.mailService.sendEmail({
      to: email,
      ...getVerifyEmailTemplate(otp),
    });

    return {
      email,
    };
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

    return;
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
      phone: phone, // Use phone for user.phone
      role,
      status: UserStatus.ACTIVE,
      // Patient profile data - basic info for registration
      firstName,
      lastName,
      dateOfBirth: parseDate(dateOfBirth),
      gender,
      patientPhone: phone, // Use phone for patient profile
      // relationship SELF sẽ được set mặc định trong auth repository
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

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }
  /**
   * Logout user - xóa cả access token và refresh token khỏi Redis
   */
  async logout(userId: number): Promise<void> {
    // Lấy tất cả tokens của user (cả access và refresh tokens)
    const tokens = await this.redisService.findAllTokens(userId);

    // Xóa tất cả tokens của user khỏi Redis
    await this.redisService.deleteTokens(tokens);

    return;
  }
}
