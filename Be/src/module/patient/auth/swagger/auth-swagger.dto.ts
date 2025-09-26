import { ApiProperty } from '@nestjs/swagger';

// Auth DTOs
export class LoginDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email đăng nhập' })
  email: string;

  @ApiProperty({ example: 'password123', description: 'Mật khẩu' })
  password: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email đăng ký' })
  email: string;

  @ApiProperty({ example: 'password123', description: 'Mật khẩu' })
  password: string;

  @ApiProperty({ example: 'password123', description: 'Xác nhận mật khẩu' })
  confirmPassword: string;

  @ApiProperty({ example: 'John', description: 'Tên' })
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'Họ' })
  lastName: string;

  @ApiProperty({ example: '0123456789', description: 'Số điện thoại' })
  phone: string;
}

export class VerifyEmailDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email cần xác thực',
  })
  email: string;

  @ApiProperty({ example: '123456', description: 'Mã OTP 6 số' })
  otp: string;
}

export class CompleteRegisterDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email' })
  email: string;

  @ApiProperty({ example: '123456', description: 'Mã OTP' })
  otp: string;

  @ApiProperty({ example: 'John', description: 'Tên' })
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'Họ' })
  lastName: string;

  @ApiProperty({ example: '0123456789', description: 'Số điện thoại' })
  phone: string;

  @ApiProperty({ example: 'password123', description: 'Mật khẩu' })
  password: string;

  @ApiProperty({ example: 'password123', description: 'Xác nhận mật khẩu' })
  confirmPassword: string;

  @ApiProperty({
    example: 'PATIENT',
    description: 'Vai trò người dùng',
    enum: ['PATIENT', 'DOCTOR', 'RECEPTIONIST'],
    required: false,
  })
  role?: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Refresh token',
  })
  refreshToken: string;
}

// Response DTOs
export class UserResponseDto {
  @ApiProperty({ example: 1, description: 'ID người dùng' })
  id: number;

  @ApiProperty({ example: 'user@example.com', description: 'Email' })
  email: string;

  @ApiProperty({ example: 'John', description: 'Tên' })
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'Họ' })
  lastName: string;

  @ApiProperty({ example: 'PATIENT', description: 'Vai trò' })
  role: string;
}

export class LoginResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Access token',
  })
  accessToken: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Refresh token',
  })
  refreshToken: string;

  @ApiProperty({ type: UserResponseDto, description: 'Thông tin người dùng' })
  user: UserResponseDto;
}

export class RegisterResponseDto {
  @ApiProperty({
    example: 'Đăng ký thành công, vui lòng kiểm tra email để xác thực',
    description: 'Thông báo',
  })
  message: string;

  @ApiProperty({ example: 'user@example.com', description: 'Email đã đăng ký' })
  email: string;
}

export class VerifyEmailResponseDto {
  @ApiProperty({
    example: 'Xác thực email thành công',
    description: 'Thông báo',
  })
  message: string;

  @ApiProperty({ example: true, description: 'Trạng thái thành công' })
  success: boolean;
}

export class CompleteRegisterResponseDto {
  @ApiProperty({
    example: 'Đăng ký hoàn tất thành công',
    description: 'Thông báo',
  })
  message: string;

  @ApiProperty({
    type: UserResponseDto,
    description: 'Thông tin người dùng đã tạo',
  })
  user: UserResponseDto;
}
