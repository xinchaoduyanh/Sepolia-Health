import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { Gender, Relationship } from '@prisma/client';

const genderValues = Object.values(Gender) as [string, ...string[]];
const relationshipValues = Object.values(Relationship) as [string, ...string[]];

// PatientProfile schema
const PatientProfileSchema = z.object({
  firstName: z.string().min(1, 'Tên không được để trống'),
  lastName: z.string().min(1, 'Họ không được để trống'),
  dateOfBirth: z.string().min(1, 'Ngày sinh không được để trống'),
  gender: z.enum(genderValues, {
    message: 'Giới tính không hợp lệ',
  }),
  phone: z.string().min(1, 'Số điện thoại không được để trống'),
  relationship: z.enum(relationshipValues, {
    message: 'Mối quan hệ không hợp lệ',
  }),
  avatar: z.string().optional(),
  idCardNumber: z.string().optional(),
  occupation: z.string().optional(),
  nationality: z.string().optional(),
  address: z.string().optional(),
  healthDetailsJson: z.record(z.string(), z.any()).optional(),
});

// Query schemas
export const GetPatientsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
});

export type GetPatientsQueryDto = z.infer<typeof GetPatientsQuerySchema>;

export class GetPatientsQueryDtoClass {
  @ApiProperty({
    description: 'Trang hiện tại',
    example: 1,
    required: false,
  })
  page?: number;

  @ApiProperty({
    description: 'Số lượng mỗi trang',
    example: 10,
    required: false,
  })
  limit?: number;

  @ApiProperty({
    description: 'Tìm kiếm theo tên, email, số điện thoại',
    example: 'Nguyễn Văn A',
    required: false,
  })
  search?: string;
}

// Zod schemas
export const CreatePatientSchema = z.object({
  // User fields
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  phone: z.string().min(1, 'Số điện thoại đăng nhập không được để trống'),

  // PatientProfiles - bắt buộc có ít nhất 1 profile với relationship SELF
  patientProfiles: z
    .array(PatientProfileSchema)
    .min(1, 'Phải có ít nhất 1 hồ sơ bệnh nhân')
    .refine(
      (profiles) => profiles.some((p) => p.relationship === 'SELF'),
      'Phải có ít nhất 1 hồ sơ với mối quan hệ SELF',
    ),
});

export type CreatePatientDto = z.infer<typeof CreatePatientSchema>;

export class PatientProfileDtoClass {
  @ApiProperty({
    description: 'Tên',
    example: 'Văn C',
  })
  firstName: string;

  @ApiProperty({
    description: 'Họ',
    example: 'Nguyễn',
  })
  lastName: string;

  @ApiProperty({
    description: 'Ngày sinh',
    example: '1990-01-15',
  })
  dateOfBirth: string;

  @ApiProperty({
    description: 'Giới tính',
    example: 'MALE',
    enum: genderValues,
  })
  gender: string;

  @ApiProperty({
    description: 'Số điện thoại liên lạc y tế',
    example: '0123456789',
  })
  phone: string;

  @ApiProperty({
    description: 'Mối quan hệ với người quản lý',
    example: 'SELF',
    enum: relationshipValues,
  })
  relationship: string;

  @ApiProperty({
    description: 'Avatar',
    example: 'https://example.com/avatar.jpg',
    required: false,
  })
  avatar?: string;

  @ApiProperty({
    description: 'Số CMND/CCCD',
    example: '123456789',
    required: false,
  })
  idCardNumber?: string;

  @ApiProperty({
    description: 'Nghề nghiệp',
    example: 'Kỹ sư',
    required: false,
  })
  occupation?: string;

  @ApiProperty({
    description: 'Quốc tịch',
    example: 'Việt Nam',
    required: false,
  })
  nationality?: string;

  @ApiProperty({
    description: 'Địa chỉ',
    example: '789 Đường DEF, Quận 3, TP.HCM',
    required: false,
  })
  address?: string;

  @ApiProperty({
    description: 'Thông tin sức khỏe bổ sung (JSON)',
    example: { allergies: ['Penicillin'], bloodType: 'O+' },
    required: false,
  })
  healthDetailsJson?: Record<string, any>;
}

export class CreatePatientDtoClass {
  @ApiProperty({
    description: 'Email đăng nhập',
    example: 'patient@sepolia.com',
  })
  email: string;

  @ApiProperty({
    description: 'Mật khẩu',
    example: 'patient123',
    minLength: 6,
  })
  password: string;

  @ApiProperty({
    description: 'Số điện thoại đăng nhập',
    example: '0123456789',
  })
  phone: string;

  @ApiProperty({
    description:
      'Danh sách hồ sơ bệnh nhân (bắt buộc có ít nhất 1 profile với relationship SELF)',
    type: [PatientProfileDtoClass],
    example: [
      {
        firstName: 'Văn C',
        lastName: 'Nguyễn',
        dateOfBirth: '1990-01-15',
        gender: 'MALE',
        phone: '0123456789',
        relationship: 'SELF',
        address: '789 Đường DEF, Quận 3, TP.HCM',
      },
    ],
  })
  patientProfiles: PatientProfileDtoClass[];
}

export const UpdatePatientSchema = z.object({
  // User fields
  email: z.string().email('Email không hợp lệ').optional(),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự').optional(),
  phone: z
    .string()
    .min(1, 'Số điện thoại đăng nhập không được để trống')
    .optional(),
  status: z.enum(['UNVERIFIED', 'ACTIVE', 'DEACTIVE']).optional(),

  // PatientProfiles - có thể cập nhật, thêm mới, hoặc xóa
  patientProfiles: z
    .object({
      // Profiles cần cập nhật (có id)
      update: z
        .array(
          z.object({
            id: z.number(),
            firstName: z.string().min(1, 'Tên không được để trống').optional(),
            lastName: z.string().min(1, 'Họ không được để trống').optional(),
            dateOfBirth: z
              .string()
              .min(1, 'Ngày sinh không được để trống')
              .optional(),
            gender: z
              .enum(genderValues, { message: 'Giới tính không hợp lệ' })
              .optional(),
            phone: z
              .string()
              .min(1, 'Số điện thoại không được để trống')
              .optional(),
            relationship: z
              .enum(relationshipValues, { message: 'Mối quan hệ không hợp lệ' })
              .optional(),
            avatar: z.string().optional(),
            idCardNumber: z.string().optional(),
            occupation: z.string().optional(),
            nationality: z.string().optional(),
            address: z.string().optional(),
            healthDetailsJson: z.record(z.string(), z.any()).optional(),
          }),
        )
        .optional(),

      // Profiles mới cần thêm
      create: z.array(PatientProfileSchema).optional(),

      // IDs của profiles cần xóa
      delete: z.array(z.number()).optional(),
    })
    .optional(),
});

export type UpdatePatientDto = z.infer<typeof UpdatePatientSchema>;

export class UpdatePatientProfileDtoClass {
  @ApiProperty({
    description: 'ID của profile cần cập nhật',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Tên',
    example: 'Văn C',
    required: false,
  })
  firstName?: string;

  @ApiProperty({
    description: 'Họ',
    example: 'Nguyễn',
    required: false,
  })
  lastName?: string;

  @ApiProperty({
    description: 'Ngày sinh',
    example: '1990-01-15',
    required: false,
  })
  dateOfBirth?: string;

  @ApiProperty({
    description: 'Giới tính',
    example: 'MALE',
    enum: genderValues,
    required: false,
  })
  gender?: string;

  @ApiProperty({
    description: 'Số điện thoại liên lạc y tế',
    example: '0123456789',
    required: false,
  })
  phone?: string;

  @ApiProperty({
    description: 'Mối quan hệ với người quản lý',
    example: 'SELF',
    enum: relationshipValues,
    required: false,
  })
  relationship?: string;

  @ApiProperty({
    description: 'Avatar',
    example: 'https://example.com/avatar.jpg',
    required: false,
  })
  avatar?: string;

  @ApiProperty({
    description: 'Số CMND/CCCD',
    example: '123456789',
    required: false,
  })
  idCardNumber?: string;

  @ApiProperty({
    description: 'Nghề nghiệp',
    example: 'Kỹ sư',
    required: false,
  })
  occupation?: string;

  @ApiProperty({
    description: 'Quốc tịch',
    example: 'Việt Nam',
    required: false,
  })
  nationality?: string;

  @ApiProperty({
    description: 'Địa chỉ',
    example: '789 Đường DEF, Quận 3, TP.HCM',
    required: false,
  })
  address?: string;

  @ApiProperty({
    description: 'Thông tin sức khỏe bổ sung (JSON)',
    example: { allergies: ['Penicillin'], bloodType: 'O+' },
    required: false,
  })
  healthDetailsJson?: Record<string, any>;
}

export class UpdatePatientDtoClass {
  @ApiProperty({
    description: 'Email đăng nhập',
    example: 'patient@sepolia.com',
    required: false,
  })
  email?: string;

  @ApiProperty({
    description: 'Mật khẩu',
    example: 'patient123',
    minLength: 6,
    required: false,
  })
  password?: string;

  @ApiProperty({
    description: 'Số điện thoại đăng nhập',
    example: '0123456789',
    required: false,
  })
  phone?: string;

  @ApiProperty({
    description: 'Trạng thái tài khoản',
    example: 'ACTIVE',
    enum: ['UNVERIFIED', 'ACTIVE', 'DEACTIVE'],
    required: false,
  })
  status?: string;

  @ApiProperty({
    description: 'Quản lý hồ sơ bệnh nhân',
    required: false,
  })
  patientProfiles?: {
    update?: UpdatePatientProfileDtoClass[];
    create?: PatientProfileDtoClass[];
    delete?: number[];
  };
}

export class PatientProfileResponseDto {
  @ApiProperty({
    description: 'ID hồ sơ bệnh nhân',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Tên',
    example: 'Văn C',
  })
  firstName: string;

  @ApiProperty({
    description: 'Họ',
    example: 'Nguyễn',
  })
  lastName: string;

  @ApiProperty({
    description: 'Họ tên đầy đủ',
    example: 'Nguyễn Văn C',
  })
  fullName: string;

  @ApiProperty({
    description: 'Ngày sinh',
    example: '1990-01-15',
  })
  dateOfBirth: string;

  @ApiProperty({
    description: 'Giới tính',
    example: 'MALE',
  })
  gender: string;

  @ApiProperty({
    description: 'Số điện thoại liên lạc y tế',
    example: '0123456789',
  })
  phone: string;

  @ApiProperty({
    description: 'Mối quan hệ với người quản lý',
    example: 'SELF',
  })
  relationship: string;

  @ApiProperty({
    description: 'Avatar',
    example: 'https://example.com/avatar.jpg',
    required: false,
  })
  avatar?: string;

  @ApiProperty({
    description: 'Số CMND/CCCD',
    example: '123456789',
    required: false,
  })
  idCardNumber?: string;

  @ApiProperty({
    description: 'Nghề nghiệp',
    example: 'Kỹ sư',
    required: false,
  })
  occupation?: string;

  @ApiProperty({
    description: 'Quốc tịch',
    example: 'Việt Nam',
    required: false,
  })
  nationality?: string;

  @ApiProperty({
    description: 'Địa chỉ',
    example: '789 Đường DEF, Quận 3, TP.HCM',
    required: false,
  })
  address?: string;

  @ApiProperty({
    description: 'Thông tin sức khỏe bổ sung (JSON)',
    example: { allergies: ['Penicillin'], bloodType: 'O+' },
    required: false,
  })
  healthDetailsJson?: Record<string, any>;

  @ApiProperty({
    description: 'Ngày tạo',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Ngày cập nhật',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}

export class CreatePatientResponseDto {
  @ApiProperty({
    description: 'ID user',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Email đăng nhập',
    example: 'patient@sepolia.com',
  })
  email: string;

  @ApiProperty({
    description: 'Số điện thoại đăng nhập',
    example: '0123456789',
  })
  phone: string;

  @ApiProperty({
    description: 'Trạng thái tài khoản',
    example: 'ACTIVE',
  })
  status: string;

  @ApiProperty({
    description: 'Danh sách hồ sơ bệnh nhân',
    type: [PatientProfileResponseDto],
  })
  patientProfiles: PatientProfileResponseDto[];

  @ApiProperty({
    description: 'Ngày tạo',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Ngày cập nhật',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}

export class PatientListResponseDto {
  @ApiProperty({
    description: 'Danh sách patient',
    type: [CreatePatientResponseDto],
  })
  patients: CreatePatientResponseDto[];

  @ApiProperty({
    description: 'Tổng số patient',
    example: 50,
  })
  total: number;

  @ApiProperty({
    description: 'Trang hiện tại',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Số lượng mỗi trang',
    example: 10,
  })
  limit: number;
}

export class PatientDetailResponseDto extends CreatePatientResponseDto {
  // Inherits all properties from CreatePatientResponseDto
}
