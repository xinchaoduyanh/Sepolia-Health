import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CustomJwtService, MailService, RedisService } from '@/common';
import { StringUtil } from '@/common/utils';
import {
  LoginDtoType,
  RegisterDtoType,
  VerifyEmailDtoType,
  CompleteRegisterDtoType,
  RefreshTokenDtoType,
  LoginResponseDtoType,
  RegisterResponseDtoType,
  VerifyEmailResponseDtoType,
  CompleteRegisterResponseDtoType,
} from './auth.dto';
import { ERROR_MESSAGES } from '@/common/constants/messages';
import { AuthRepository } from '@/module/patient/auth/auth.repository';
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtAuthService: CustomJwtService,
    private readonly mailService: MailService,
    private readonly authRepository: AuthRepository,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Login user
   */
  async login(loginDto: LoginDtoType): Promise<LoginResponseDtoType> {
    const { email, password } = loginDto;

    const user = await this.authRepository.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.INVALID_PASSWORD);
    }

    if (!user.isVerified) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.USER_NOT_VERIFIED);
    }

    if (user.password !== password) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.INVALID_PASSWORD);
    }

    // Generate tokens
    const tokens = this.jwtAuthService.generateTokens({
      userId: user.id.toString(),
      role: user.role,
    });

    // Update last login
    await this.authRepository.updateLastLogin(user.id);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * Register user - send verification email
   */
  async register(
    registerDto: RegisterDtoType,
  ): Promise<RegisterResponseDtoType> {
    const { email, password, firstName, lastName, phone } = registerDto;

    // Check if user already exists
    const existingUser = await this.authRepository.findByEmail(email);

    if (existingUser) {
      throw new ConflictException(ERROR_MESSAGES.AUTH.EMAIL_ALREADY_EXISTS);
    }

    // Generate OTP
    const otp = StringUtil.random(6, '0123456789');
    await this.redisService.setOtp(email, otp, 5 * 60, 'register');
    // Send verification email

    return {
      message: 'Đăng ký thành công, vui lòng kiểm tra email để xác thực',
      email,
    };
  }

  /**
   * Verify email with OTP
   */
  async verifyEmail(
    verifyEmailDto: VerifyEmailDtoType,
  ): Promise<VerifyEmailResponseDtoType> {
    const { email, otp } = verifyEmailDto;

    // Find OTP record
    const otpRecord = await this.prisma.registrationOtp.findFirst({
      where: {
        email,
        otp,
        expiresAt: { gt: new Date() },
      },
    });

    if (!otpRecord) {
      throw new BadRequestException('Mã OTP không hợp lệ hoặc đã hết hạn');
    }

    return {
      message: 'Xác thực email thành công',
      success: true,
    };
  }

  /**
   * Complete registration after email verification
   */
  async completeRegister(
    completeRegisterDto: CompleteRegisterDtoType,
  ): Promise<CompleteRegisterResponseDtoType> {
    const { email, otp, firstName, lastName, phone, password, role } =
      completeRegisterDto;

    // Verify OTP again
    const otpRecord = await this.prisma.registrationOtp.findFirst({
      where: {
        email,
        otp,
        expiresAt: { gt: new Date() },
      },
    });

    if (!otpRecord) {
      throw new BadRequestException('Mã OTP không hợp lệ hoặc đã hết hạn');
    }

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        password, // In production, hash this password
        firstName,
        lastName,
        phone,
        role,
        isVerified: true,
        verifiedAt: new Date(),
      },
    });

    // Clean up OTP record
    await this.prisma.registrationOtp.delete({
      where: { id: otpRecord.id },
    });

    return {
      message: 'Đăng ký hoàn tất thành công',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(
    refreshTokenDto: RefreshTokenDtoType,
  ): Promise<LoginResponseDtoType> {
    const { refreshToken } = refreshTokenDto;

    try {
      // Verify refresh token
      const payload = this.jwtAuthService.verifyToken(refreshToken);

      // Find user
      const user = await this.prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user) {
        throw new UnauthorizedException(ERROR_MESSAGES.AUTH.USER_NOT_FOUND);
      }

      // Generate new tokens
      const tokens = this.jwtAuthService.generateTokens({
        userId: user.id,
      });

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      };
    } catch {
      throw new UnauthorizedException(
        ERROR_MESSAGES.AUTH.REFRESH_TOKEN_INVALID,
      );
    }
  }
}
