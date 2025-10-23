import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CustomJwtService } from '@/common/modules/jwt/jwt.service';
import {
  AdminLoginDto,
  AdminLoginResponseDto,
  AdminMeResponseDto,
  AdminRefreshResponseDto,
} from './admin-auth.dto';

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: CustomJwtService,
  ) {}

  async login(loginDto: AdminLoginDto): Promise<AdminLoginResponseDto> {
    const { email, password } = loginDto;

    // Find admin user
    const admin = await this.prisma.user.findFirst({
      where: {
        email,
        role: 'ADMIN',
      },
    });
    if (!admin) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    // Verify password (plain text comparison)
    if (password !== admin.password) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    // Generate tokens using CustomJwtService
    const tokens = this.jwtService.generateTokens({
      userId: admin.id,
      role: admin.role,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      admin: {
        id: admin.id,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
        status: admin.status,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
      },
    };
  }

  logout(): Promise<{ message: string }> {
    // Simple logout - just return success message
    // In a more complex setup, you could:
    // 1. Blacklist the token
    // 2. Remove token from Redis cache
    // 3. Log the logout event

    return Promise.resolve({
      message: 'Đăng xuất thành công',
    });
  }

  async getMe(userId: number): Promise<AdminMeResponseDto> {
    const admin = await this.prisma.user.findUnique({
      where: {
        id: userId,
        role: 'ADMIN',
      },
    });

    if (!admin) {
      throw new UnauthorizedException('Admin không tồn tại');
    }

    return {
      admin: {
        id: admin.id,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
        status: admin.status,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
      },
    };
  }

  async refreshTokens(refreshToken: string): Promise<AdminRefreshResponseDto> {
    // Verify refresh token
    const result = this.jwtService.verifyToken(refreshToken, 'refresh');

    if (!result.valid || !result.payload) {
      throw new UnauthorizedException(
        'Refresh token không hợp lệ hoặc đã hết hạn',
      );
    }

    // Find admin user
    const admin = await this.prisma.user.findFirst({
      where: {
        id: result.payload.userId,
        role: 'ADMIN',
      },
    });

    if (!admin) {
      throw new UnauthorizedException('Admin không tồn tại');
    }

    // Generate new tokens
    const tokens = this.jwtService.generateTokens({
      userId: admin.id,
      role: admin.role,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }
}
