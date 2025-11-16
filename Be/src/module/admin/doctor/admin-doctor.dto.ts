import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { UserStatus } from '@prisma/client';

// Password regex: tối thiểu 6 ký tự, có chữ IN HOA, có số, có ký tự đặc biệt
const PASSWORD_REGEX =
  /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,}$/;

// Helper function để validate password với regex
const passwordRefine = (password: string) => {
  return PASSWORD_REGEX.test(password);
};

// Query schemas
export const GetDoctorsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  clinicId: z.coerce.number().optional(),
  serviceId: z.coerce.number().optional(),
});

export type GetDoctorsQueryDto = z.infer<typeof GetDoctorsQuerySchema>;

// Zod schemas
export const CreateDoctorSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z
    .string()
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
    .refine(
      passwordRefine,
      'Mật khẩu phải có ít nhất 6 ký tự, bao gồm chữ IN HOA, số và ký tự đặc biệt',
    ),
  fullName: z.string().min(1, 'Họ tên không được để trống'),
  phone: z.string().min(1, 'Số điện thoại không được để trống'),
  experienceYears: z.number().min(0, 'Số năm kinh nghiệm phải >= 0'),
  description: z.string().optional(),
  address: z.string().optional(),
  clinicId: z.number().int().positive({ message: 'Clinic ID không hợp lệ' }),
  serviceIds: z
    .array(z.number().int().positive())
    .min(1, 'Cần chọn ít nhất một dịch vụ'),
  availabilities: z
    .array(
      z.object({
        dayOfWeek: z.number().int().min(0).max(6), // 0 = Sunday, 6 = Saturday
        startTime: z.string().min(1, 'Giờ bắt đầu không được để trống'),
        endTime: z.string().min(1, 'Giờ kết thúc không được để trống'),
      }),
    )
    .optional(),
});

export type CreateDoctorDto = z.infer<typeof CreateDoctorSchema>;

export class CreateDoctorDtoClass {
  @ApiProperty({
    description: 'Email bác sĩ',
    example: 'doctor@sepolia.com',
  })
  email: string;

  @ApiProperty({
    description: 'Mật khẩu',
    example: 'doctor123',
    minLength: 6,
  })
  password: string;

  @ApiProperty({
    description: 'Họ tên bác sĩ',
    example: 'Nguyễn Văn A',
  })
  fullName: string;

  @ApiProperty({
    description: 'Số điện thoại',
    example: '0123456789',
  })
  phone: string;

  @ApiProperty({
    description: 'Số năm kinh nghiệm',
    example: 5,
  })
  experienceYears: number;

  @ApiProperty({
    description: 'Mô tả',
    example: 'Bác sĩ chuyên khoa tim mạch với 5 năm kinh nghiệm',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Địa chỉ',
    example: '123 Đường ABC, Quận 1, TP.HCM',
    required: false,
  })
  address?: string;

  @ApiProperty({
    description: 'ID cơ sở phòng khám (Clinic)',
    example: 1,
  })
  clinicId: number;

  @ApiProperty({
    description: 'Danh sách dịch vụ bác sĩ cung cấp (Service IDs)',
    example: [1, 2, 3],
    isArray: true,
    type: Number,
  })
  serviceIds: number[];

  @ApiProperty({
    description: 'Lịch làm việc hàng tuần (tùy chọn)',
    required: false,
    example: [
      { dayOfWeek: 1, startTime: '08:00', endTime: '17:00' },
      { dayOfWeek: 3, startTime: '08:00', endTime: '17:00' },
    ],
  })
  availabilities?: Array<{
    dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    startTime: string;
    endTime: string;
  }>;
}

export const UpdateDoctorSchema = z.object({
  fullName: z.string().min(1, 'Họ tên không được để trống').optional(),
  phone: z.string().min(1, 'Số điện thoại không được để trống').optional(),
  experienceYears: z.number().min(0, 'Số năm kinh nghiệm phải >= 0').optional(),
  description: z.string().optional(),
  address: z.string().optional(),
});

export type UpdateDoctorDto = z.infer<typeof UpdateDoctorSchema>;

export const UpdateDoctorStatusSchema = z.object({
  status: z.nativeEnum(UserStatus),
});

export type UpdateDoctorStatusDto = z.infer<typeof UpdateDoctorStatusSchema>;

export class UpdateDoctorDtoClass {
  @ApiProperty({
    description: 'Họ tên bác sĩ',
    example: 'Nguyễn Văn A',
    required: false,
  })
  fullName?: string;

  @ApiProperty({
    description: 'Số điện thoại',
    example: '0123456789',
    required: false,
  })
  phone?: string;

  @ApiProperty({
    description: 'Số năm kinh nghiệm',
    example: 5,
    required: false,
  })
  experienceYears?: number;

  @ApiProperty({
    description: 'Mô tả',
    example: 'Bác sĩ chuyên khoa tim mạch với 5 năm kinh nghiệm',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Địa chỉ',
    example: '123 Đường ABC, Quận 1, TP.HCM',
    required: false,
  })
  address?: string;
}

export class UpdateDoctorStatusDtoClass {
  @ApiProperty({
    description: 'Trạng thái tài khoản',
    example: 'ACTIVE',
    enum: UserStatus,
  })
  status: UserStatus;
}

export class CreateDoctorResponseDto {
  @ApiProperty({
    description: 'ID bác sĩ',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Email bác sĩ',
    example: 'doctor@sepolia.com',
  })
  email: string;

  @ApiProperty({
    description: 'Họ tên bác sĩ',
    example: 'Nguyễn Văn A',
  })
  fullName: string;

  @ApiProperty({
    description: 'Danh sách chuyên khoa',
    example: ['Tim mạch', 'Nội tổng quát'],
    isArray: true,
    type: String,
  })
  services: string[];

  @ApiProperty({
    description: 'Số năm kinh nghiệm',
    example: 5,
  })
  experienceYears: number;

  @ApiProperty({
    description: 'Số điện thoại',
    example: '0123456789',
    required: false,
  })
  phone?: string;

  @ApiProperty({
    description: 'Trạng thái',
    example: 'ACTIVE',
  })
  status: string;

  @ApiProperty({
    description: 'Thông tin cơ sở',
    example: { id: 1, name: 'Phòng khám Sepolia' },
    required: false,
  })
  clinic?: { id: number; name: string } | null;

  @ApiProperty({
    description: 'Ngày tạo',
    example: '2024-01-01T00:00:00.000Z',
    required: false,
  })
  createdAt?: Date;
}

export class DoctorListResponseDto {
  @ApiProperty({
    description: 'Danh sách bác sĩ',
    type: [CreateDoctorResponseDto],
  })
  doctors: CreateDoctorResponseDto[];

  @ApiProperty({
    description: 'Tổng số bác sĩ',
    example: 10,
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

export class DoctorDetailResponseDto {
  @ApiProperty({
    description: 'ID bác sĩ',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Email bác sĩ',
    example: 'doctor@sepolia.com',
  })
  email: string;

  @ApiProperty({
    description: 'Họ tên bác sĩ',
    example: 'Nguyễn Văn A',
  })
  fullName: string;

  @ApiProperty({
    description: 'Danh sách dịch vụ chi tiết',
    example: [
      { id: 1, name: 'Khám tim mạch', price: 500000, duration: 30 },
      { id: 2, name: 'Siêu âm tim mạch', price: 800000, duration: 45 },
    ],
    isArray: true,
  })
  services: Array<{
    id: number;
    name: string;
    price: number;
    duration: number;
    description?: string;
  }>;

  @ApiProperty({
    description: 'Thống kê lịch hẹn',
    example: {
      total: 150,
      completed: 120,
      cancelled: 15,
      upcoming: 15,
    },
  })
  appointmentStats: {
    total: number;
    completed: number;
    cancelled: number;
    upcoming: number;
    onGoing: number;
  };

  @ApiProperty({
    description: 'Số năm kinh nghiệm',
    example: 5,
  })
  experienceYears: number;

  @ApiProperty({
    description: 'Số điện thoại',
    example: '0123456789',
  })
  phone: string;

  @ApiProperty({
    description: 'Mô tả',
    example: 'Bác sĩ chuyên khoa tim mạch với 5 năm kinh nghiệm',
  })
  description?: string;

  @ApiProperty({
    description: 'Địa chỉ',
    example: '123 Đường ABC, Quận 1, TP.HCM',
  })
  address?: string;

  @ApiProperty({
    description: 'Trạng thái',
    example: 'ACTIVE',
  })
  status: string;

  @ApiProperty({
    description: 'Thông tin cơ sở',
    example: { id: 1, name: 'Phòng khám Sepolia' },
    required: false,
  })
  clinic?: { id: number; name: string } | null;

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

export const CreateDoctorScheduleSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6), // 0 = Sunday, 6 = Saturday
  startTime: z.string().min(1, 'Giờ bắt đầu không được để trống'),
  endTime: z.string().min(1, 'Giờ kết thúc không được để trống'),
  locationId: z.number().min(1, 'ID cơ sở phòng khám không hợp lệ'),
  notes: z.string().optional(),
});

export type CreateDoctorScheduleDto = z.infer<
  typeof CreateDoctorScheduleSchema
>;

export class CreateDoctorScheduleDtoClass {
  @ApiProperty({
    description: 'Thứ trong tuần (0 = Chủ nhật, 1 = Thứ 2, ..., 6 = Thứ 7)',
    example: 1,
    minimum: 0,
    maximum: 6,
  })
  dayOfWeek: number;

  @ApiProperty({
    description: 'Giờ bắt đầu',
    example: '08:00',
  })
  startTime: string;

  @ApiProperty({
    description: 'Giờ kết thúc',
    example: '17:00',
  })
  endTime: string;

  @ApiProperty({
    description: 'ID cơ sở phòng khám',
    example: 1,
  })
  locationId: number;

  @ApiProperty({
    description: 'Ghi chú',
    example: 'Lịch làm việc thường xuyên',
    required: false,
  })
  notes?: string;
}
