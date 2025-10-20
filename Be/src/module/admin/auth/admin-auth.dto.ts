import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

// Zod schema
export const AdminLoginSchema = z.object({
  email: z.email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

export type AdminLoginDto = z.infer<typeof AdminLoginSchema>;

export class AdminLoginDtoClass {
  @ApiProperty({
    description: 'Email admin',
    example: 'admin@sepolia.com',
  })
  email: string;

  @ApiProperty({
    description: 'Mật khẩu',
    example: 'admin123',
    minLength: 6,
  })
  password: string;
}

export class AdminLoginResponseDto {
  @ApiProperty({
    description: 'Access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Thông tin admin',
    example: {
      id: 1,
      email: 'admin@sepolia.com',
      role: 'ADMIN',
    },
  })
  admin: {
    id: number;
    email: string;
    role: string;
  };
}
