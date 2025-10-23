import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AdminAuthService } from './admin-auth.service';
import {
  AdminLoginDto,
  AdminLoginResponseDto,
  AdminLoginDtoClass,
  AdminMeResponseDto,
  AdminRefreshResponseDto,
} from './admin-auth.dto';
import { Public } from '@/common/decorators';
import { JwtAuthGuard } from '@/common/guards';

@ApiTags('Admin Auth')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập admin' })
  @ApiBody({ type: AdminLoginDtoClass })
  @ApiResponse({
    status: 200,
    description: 'Đăng nhập thành công',
    type: AdminLoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Email hoặc mật khẩu không đúng' })
  async login(
    @Body()
    loginDto: AdminLoginDto,
  ): Promise<AdminLoginResponseDto> {
    return this.adminAuthService.login(loginDto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng xuất admin' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: 200,
    description: 'Đăng xuất thành công',
  })
  async logout(): Promise<{ message: string }> {
    return this.adminAuthService.logout();
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy thông tin admin hiện tại' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin admin thành công',
    type: AdminMeResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMe(@Req() req: any): Promise<AdminMeResponseDto> {
    return this.adminAuthService.getMe(req.user.userId);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Làm mới access token và refresh token' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refreshToken: {
          type: 'string',
          description: 'Refresh token',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
      required: ['refreshToken'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Làm mới token thành công',
    type: AdminRefreshResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token không hợp lệ hoặc đã hết hạn',
  })
  async refreshTokens(
    @Body('refreshToken') refreshToken: string,
  ): Promise<AdminRefreshResponseDto> {
    return this.adminAuthService.refreshTokens(refreshToken);
  }
}
