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
      phone: '+84901234567',
      role: 'ADMIN',
      status: 'ACTIVE',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  })
  admin: {
    id: number;
    email: string;
    phone: string | null;
    role: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

export class AdminMeResponseDto {
  @ApiProperty({
    description: 'Thông tin admin hiện tại',
    example: {
      id: 1,
      email: 'admin@sepolia.com',
      phone: '+84901234567',
      role: 'ADMIN',
      status: 'ACTIVE',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  })
  admin: {
    id: number;
    email: string;
    phone: string | null;
    role: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

export class AdminRefreshResponseDto {
  @ApiProperty({
    description: 'Access token mới',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Refresh token mới',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;
}
