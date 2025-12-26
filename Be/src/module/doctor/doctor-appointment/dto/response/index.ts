import { ApiProperty } from '@nestjs/swagger';
import { AppointmentResultFileDto } from '../appointment-result-file.dto';

export class AppointmentResultDto {
  @ApiProperty({
    description: 'ID kết quả khám',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Chẩn đoán',
    example: 'Viêm họng cấp tính',
    nullable: true,
  })
  diagnosis?: string | null;

  @ApiProperty({
    description: 'Ghi chú của bác sĩ',
    example: 'Bệnh nhân cần nghỉ ngơi và uống thuốc đúng giờ',
    nullable: true,
  })
  notes?: string | null;

  @ApiProperty({
    description: 'Đơn thuốc',
    example: 'Paracetamol 500mg: 2 viên/lần, 3 lần/ngày sau ăn',
    nullable: true,
  })
  prescription?: string | null;

  @ApiProperty({
    description: 'Khuyến nghị, lời dặn',
    example: 'Tái khám sau 1 tuần nếu không thuyên giảm',
    nullable: true,
  })
  recommendations?: string | null;

  @ApiProperty({
    description: 'File đính kèm (ảnh, PDF)',
    type: [AppointmentResultFileDto],
    required: false,
  })
  files?: AppointmentResultFileDto[];

  @ApiProperty({
    description: 'ID appointment',
    example: 1,
  })
  appointmentId: number;

  @ApiProperty({
    description: 'Thời điểm tạo',
    example: '2024-12-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Thời điểm cập nhật',
    example: '2024-12-01T00:00:00.000Z',
  })
  updatedAt: Date;
}

export class DoctorAppointmentDetailDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  startTime: Date;

  @ApiProperty()
  endTime: Date;

  @ApiProperty()
  status: string;

  @ApiProperty()
  notes?: string | null;

  @ApiProperty()
  type: string;

  @ApiProperty({
    description: 'Thông tin bệnh nhân',
  })
  patient?: {
    id: number;
    firstName: string;
    lastName: string;
    phone: string;
    dateOfBirth: Date;
    gender: string;
    idCardNumber?: string;
    occupation?: string;
    nationality?: string;
    address?: string;
    additionalInfo?: Record<string, any> | null;
  };

  @ApiProperty({
    description: 'Thông tin bác sĩ',
  })
  doctor?: {
    id: number;
    firstName: string;
    lastName: string;
  };

  @ApiProperty({
    description: 'Thông tin dịch vụ',
  })
  service?: {
    id: number;
    name: string;
    price: number;
    duration: number;
  };

  @ApiProperty({
    description: 'Thông tin phòng khám',
  })
  clinic?: {
    id: number;
    name: string;
    address: string;
  } | null;

  @ApiProperty({
    description: 'Feedback từ bệnh nhân',
    type: () => Object,
  })
  feedback?: {
    id: number;
    rating: number;
    comment?: string | null;
    createdAt: Date;
  } | null;

  @ApiProperty({
    description: 'Kết quả khám từ bác sĩ',
    type: () => AppointmentResultDto,
  })
  result?: AppointmentResultDto | null;

  @ApiProperty({
    description: 'Host URL for online appointments',
    example: 'https://zoom.us/s/xxx/u/xxx',
    nullable: true,
  })
  hostUrl?: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class DoctorAppointmentsListResponseDto {
  @ApiProperty({ type: [DoctorAppointmentDetailDto] })
  data: DoctorAppointmentDetailDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}
