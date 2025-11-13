import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { AppointmentStatus, PaymentStatus } from '@prisma/client';

const appointmentStatusValues = Object.values(AppointmentStatus) as [
  string,
  ...string[],
];
const paymentStatusValues = Object.values(PaymentStatus) as [
  string,
  ...string[],
];

// Zod schemas
export const GetAppointmentsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  status: z.enum(appointmentStatusValues).optional(),
  billingStatus: z.enum(paymentStatusValues).optional(),
  doctorId: z.coerce.number().optional(),
  clinicId: z.coerce.number().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export type GetAppointmentsDto = z.infer<typeof GetAppointmentsSchema>;

export class GetAppointmentsDtoClass {
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
    description: 'Tìm kiếm theo tên bệnh nhân, số điện thoại',
    example: 'Nguyễn Văn A',
    required: false,
  })
  search?: string;

  @ApiProperty({
    description: 'Lọc theo trạng thái cuộc hẹn',
    example: 'UPCOMING',
    enum: appointmentStatusValues,
    required: false,
  })
  status?: string;

  @ApiProperty({
    description: 'Lọc theo trạng thái thanh toán (từ billing)',
    example: 'PAID',
    enum: paymentStatusValues,
    required: false,
  })
  billingStatus?: string;

  @ApiProperty({
    description: 'Lọc theo bác sĩ',
    example: 1,
    required: false,
  })
  doctorId?: number;

  @ApiProperty({
    description: 'Lọc theo phòng khám',
    example: 1,
    required: false,
  })
  clinicId?: number;

  @ApiProperty({
    description: 'Lọc từ ngày',
    example: '2024-01-01',
    required: false,
  })
  dateFrom?: string;

  @ApiProperty({
    description: 'Lọc đến ngày',
    example: '2024-12-31',
    required: false,
  })
  dateTo?: string;
}

// Response DTOs
export class AppointmentDoctorDto {
  @ApiProperty({
    description: 'ID bác sĩ',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Tên bác sĩ',
    example: 'Nguyễn Văn Bác Sĩ',
  })
  fullName: string;

  @ApiProperty({
    description: 'Chuyên khoa',
    example: 'Tim mạch',
  })
  specialty: string;

  @ApiProperty({
    description: 'Avatar',
    example: 'https://example.com/avatar.jpg',
    required: false,
  })
  avatar?: string;
}

export class AppointmentServiceDto {
  @ApiProperty({
    description: 'ID dịch vụ',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Tên dịch vụ',
    example: 'Khám tim mạch',
  })
  name: string;

  @ApiProperty({
    description: 'Giá dịch vụ',
    example: 500000,
  })
  price: number;

  @ApiProperty({
    description: 'Thời lượng (phút)',
    example: 30,
  })
  duration: number;

  @ApiProperty({
    description: 'Mô tả',
    example: 'Khám và tư vấn tim mạch',
    required: false,
  })
  description?: string;
}

export class AppointmentClinicDto {
  @ApiProperty({
    description: 'ID phòng khám',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Tên phòng khám',
    example: 'Phòng khám Sepolia Health',
  })
  name: string;

  @ApiProperty({
    description: 'Địa chỉ',
    example: '123 Đường ABC, Quận 1, TP.HCM',
  })
  address: string;

  @ApiProperty({
    description: 'Số điện thoại',
    example: '0123456789',
    required: false,
  })
  phone?: string;
}

export class AppointmentPatientProfileDto {
  @ApiProperty({
    description: 'ID hồ sơ bệnh nhân',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Tên đầy đủ',
    example: 'Nguyễn Văn A',
  })
  fullName: string;

  @ApiProperty({
    description: 'Số điện thoại',
    example: '0123456789',
  })
  phone: string;

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
}

export class AppointmentBillingDto {
  @ApiProperty({
    description: 'ID hóa đơn',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Số tiền',
    example: 500000,
  })
  amount: number;

  @ApiProperty({
    description: 'Trạng thái thanh toán',
    example: 'PAID',
  })
  status: string;

  @ApiProperty({
    description: 'Phương thức thanh toán',
    example: 'ONLINE',
    required: false,
  })
  paymentMethod?: string;

  @ApiProperty({
    description: 'Ghi chú',
    example: 'Thanh toán qua VNPay',
    required: false,
  })
  notes?: string;

  @ApiProperty({
    description: 'Ngày tạo',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;
}

export class AppointmentResponseDto {
  @ApiProperty({
    description: 'ID cuộc hẹn',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Ngày hẹn',
    example: '2024-01-15',
  })
  date: string;

  @ApiProperty({
    description: 'Giờ bắt đầu',
    example: '09:00',
  })
  startTime: string;

  @ApiProperty({
    description: 'Giờ kết thúc',
    example: '09:30',
  })
  endTime: string;

  @ApiProperty({
    description: 'Trạng thái cuộc hẹn',
    example: 'UPCOMING',
  })
  status: string;

  @ApiProperty({
    description: 'Ghi chú',
    example: 'Bệnh nhân cần khám tim mạch',
    required: false,
  })
  notes?: string;

  @ApiProperty({
    description: 'Tên bệnh nhân',
    example: 'Nguyễn Văn A',
  })
  patientName: string;

  @ApiProperty({
    description: 'Ngày sinh bệnh nhân',
    example: '1990-01-15',
  })
  patientDob: string;

  @ApiProperty({
    description: 'Số điện thoại bệnh nhân',
    example: '0123456789',
  })
  patientPhone: string;

  @ApiProperty({
    description: 'Giới tính bệnh nhân',
    example: 'MALE',
  })
  patientGender: string;

  @ApiProperty({
    description: 'Thông tin bác sĩ',
    type: AppointmentDoctorDto,
  })
  doctor: AppointmentDoctorDto;

  @ApiProperty({
    description: 'Thông tin dịch vụ',
    type: AppointmentServiceDto,
  })
  service: AppointmentServiceDto;

  @ApiProperty({
    description: 'Thông tin phòng khám',
    type: AppointmentClinicDto,
  })
  clinic: AppointmentClinicDto;

  @ApiProperty({
    description: 'Hồ sơ bệnh nhân (nếu có)',
    type: AppointmentPatientProfileDto,
    required: false,
  })
  patientProfile?: AppointmentPatientProfileDto;

  @ApiProperty({
    description: 'Thông tin thanh toán',
    type: AppointmentBillingDto,
    required: false,
  })
  billing?: AppointmentBillingDto;

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

export class AppointmentListResponseDto {
  @ApiProperty({
    description: 'Danh sách cuộc hẹn',
    type: [AppointmentResponseDto],
  })
  appointments: AppointmentResponseDto[];

  @ApiProperty({
    description: 'Tổng số cuộc hẹn',
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

export class AppointmentDetailResponseDto extends AppointmentResponseDto {
  // Inherits all properties from AppointmentResponseDto
}
