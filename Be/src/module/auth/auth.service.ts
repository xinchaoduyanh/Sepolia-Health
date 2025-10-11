import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
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
import { tokenStorageConfig } from '@/common/config';
import { ConfigType } from '@nestjs/config';
import { ERROR_MESSAGES } from '@/common/constants/error-messages';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtAuthService: CustomJwtService,
    private readonly mailService: MailService,
    private readonly authRepository: AuthRepository,
    private readonly redisService: RedisService,
    @Inject(tokenStorageConfig.KEY)
    private readonly tokenConf: ConfigType<typeof tokenStorageConfig>,
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

    if (!user.isVerified) {
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
  async register(registerDto: RegisterDto): Promise<RegisterResponseDto> {
    const { email } = registerDto;

    // Check if user already exists
    await this.authRepository.isEmailExists(email);

    // Generate OTP
    const otp = StringUtil.random(6, '0123456789');
    await this.redisService.setOtp(email, otp, 5 * 60, 'register');

    // Send OTP via email
    await this.mailService.sendEmail({
      to: email,
      subject: 'Mã xác thực đăng ký - Phòng khám Sepolia',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c3e50;">Phòng khám Sepolia</h1>
            <h2 style="color: #3498db;">Xác thực tài khoản</h2>
          </div>

          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <p>Xin chào,</p>
            <p>Bạn đã yêu cầu đăng ký tài khoản tại <strong>Phòng khám Sepolia</strong>.</p>
            <p>Mã xác thực của bạn là:</p>

            <div style="text-align: center; margin: 30px 0;">
              <span style="font-size: 32px; font-weight: bold; color: #e74c3c; background-color: #fff; padding: 15px 30px; border-radius: 10px; border: 2px dashed #e74c3c;">${otp}</span>
            </div>

            <p><strong>Lưu ý:</strong></p>
            <ul>
              <li>Mã xác thực có hiệu lực trong <strong>5 phút</strong></li>
              <li>Không chia sẻ mã này với bất kỳ ai</li>
              <li>Nếu bạn không yêu cầu đăng ký, vui lòng bỏ qua email này</li>
            </ul>
          </div>

          <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #7f8c8d;">
            <p>Email này được gửi tự động từ hệ thống Phòng khám Sepolia</p>
            <p>Cảm ơn bạn đã tin tưởng dịch vụ của chúng tôi!</p>
          </div>
        </div>
      `,
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
    const { email, otp, firstName, lastName, phone, password, role } =
      completeRegisterDto;

    // Verify OTP again
    const isOtpValid = await this.redisService.verifyOtp(
      email,
      otp,
      'register',
    );

    if (!isOtpValid) {
      throw new BadRequestException(ERROR_MESSAGES.AUTH.INVALID_OTP);
    }

    // Create user
    const user = await this.authRepository.createUser({
      email,
      password,
      firstName,
      lastName,
      phone,
      role,
      isVerified: true,
      verifiedAt: new Date(),
    });

    return {
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
  async logout(userId: number, refreshToken: string): Promise<void> {
    // Lấy tất cả tokens của user (cả access và refresh tokens)
    const tokens = await this.redisService.findAllTokens(userId);

    // Xóa tất cả tokens của user khỏi Redis
    await this.redisService.deleteTokens(tokens);

    return;
  }
}
