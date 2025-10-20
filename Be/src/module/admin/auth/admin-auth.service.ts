import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CustomJwtService } from '@/common/modules/jwt/jwt.service';
import { AdminLoginDto, AdminLoginResponseDto } from './admin-auth.dto';

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
        role: admin.role,
      },
    };
  }
}
