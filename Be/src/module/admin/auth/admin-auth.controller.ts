import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AdminAuthService } from './admin-auth.service';
import {
  AdminLoginDto,
  AdminLoginResponseDto,
  AdminLoginDtoClass,
  AdminLoginSchema,
} from './admin-auth.dto';
import { Public } from '@/common/decorators';
import { CustomZodValidationPipe } from '@/common/pipes';

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
    @Body(new CustomZodValidationPipe(AdminLoginSchema))
    loginDto: AdminLoginDto,
  ): Promise<AdminLoginResponseDto> {
    return this.adminAuthService.login(loginDto);
  }
}
