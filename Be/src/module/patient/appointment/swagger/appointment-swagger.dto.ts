import { ApiProperty } from '@nestjs/swagger';

// Appointment DTOs
export class CreateAppointmentDto {
  @ApiProperty({ example: 'doctor-uuid', description: 'ID bác sĩ' })
  doctorId: string;

  @ApiProperty({ example: 'service-uuid', description: 'ID dịch vụ' })
  serviceId: string;

  @ApiProperty({ example: '2024-01-15T10:00:00Z', description: 'Ngày giờ hẹn' })
  date: string;

  @ApiProperty({
    example: 'Khám tổng quát',
    description: 'Ghi chú',
    required: false,
  })
  notes?: string;
}

export class UpdateAppointmentDto {
  @ApiProperty({
    example: '2024-01-15T10:00:00Z',
    description: 'Ngày giờ hẹn',
    required: false,
  })
  date?: string;

  @ApiProperty({
    example: 'scheduled',
    description: 'Trạng thái lịch hẹn',
    enum: ['scheduled', 'completed', 'cancelled'],
    required: false,
  })
  status?: string;

  @ApiProperty({
    example: 'pending',
    description: 'Trạng thái thanh toán',
    enum: ['pending', 'paid', 'refunded'],
    required: false,
  })
  paymentStatus?: string;

  @ApiProperty({
    example: 'Ghi chú mới',
    description: 'Ghi chú',
    required: false,
  })
  notes?: string;
}

export class GetAppointmentsQueryDto {
  @ApiProperty({ example: 1, description: 'Trang', required: false })
  page?: number;

  @ApiProperty({
    example: 10,
    description: 'Số lượng mỗi trang',
    required: false,
  })
  limit?: number;

  @ApiProperty({
    example: 'scheduled',
    description: 'Trạng thái lịch hẹn',
    enum: ['scheduled', 'completed', 'cancelled'],
    required: false,
  })
  status?: string;

  @ApiProperty({
    example: 'pending',
    description: 'Trạng thái thanh toán',
    enum: ['pending', 'paid', 'refunded'],
    required: false,
  })
  paymentStatus?: string;

  @ApiProperty({
    example: 'doctor-uuid',
    description: 'ID bác sĩ',
    required: false,
  })
  doctorId?: string;

  @ApiProperty({ example: '1', description: 'ID bệnh nhân', required: false })
  patientId?: string;

  @ApiProperty({
    example: '2024-01-01T00:00:00Z',
    description: 'Từ ngày',
    required: false,
  })
  dateFrom?: string;

  @ApiProperty({
    example: '2024-01-31T23:59:59Z',
    description: 'Đến ngày',
    required: false,
  })
  dateTo?: string;
}
