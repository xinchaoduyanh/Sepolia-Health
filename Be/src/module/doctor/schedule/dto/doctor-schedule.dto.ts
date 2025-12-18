import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { ApiProperty } from '@nestjs/swagger';

// Query DTO for getting weekly schedule
export const GetWeeklyScheduleQuerySchema = z.object({
  weekStartDate: z.string().optional(), // ISO date string (YYYY-MM-DD), defaults to current week start
});

export class GetWeeklyScheduleQueryDto extends createZodDto(
  GetWeeklyScheduleQuerySchema,
) {}

// Response DTOs
export class DoctorAvailabilityDto {
  @ApiProperty({ description: 'ID của lịch làm việc', example: 1 })
  id: number;

  @ApiProperty({
    description: 'Thứ trong tuần (0 = Chủ nhật, 1 = Thứ 2, ..., 6 = Thứ 7)',
    example: 1,
  })
  dayOfWeek: number;

  @ApiProperty({ description: 'Giờ bắt đầu', example: '08:00' })
  startTime: string;

  @ApiProperty({ description: 'Giờ kết thúc', example: '17:00' })
  endTime: string;
}

export class AvailabilityOverrideDto {
  @ApiProperty({ description: 'ID của override', example: 1 })
  id: number;

  @ApiProperty({
    description: 'Ngày cụ thể (ISO date format)',
    example: '2024-01-15',
  })
  date: string;

  @ApiProperty({
    description: 'Giờ bắt đầu (null nếu nghỉ)',
    example: '09:00',
    required: false,
    nullable: true,
  })
  startTime: string | null;

  @ApiProperty({
    description: 'Giờ kết thúc (null nếu nghỉ)',
    example: '18:00',
    required: false,
    nullable: true,
  })
  endTime: string | null;
}

export class BookedTimeSlotDto {
  @ApiProperty({ description: 'Giờ bắt đầu', example: '09:00' })
  startTime: string;

  @ApiProperty({ description: 'Giờ kết thúc', example: '09:30' })
  endTime: string;

  @ApiProperty({ description: 'Thời gian hiển thị', example: '09:00 - 09:30' })
  displayTime: string;

  @ApiProperty({ description: 'ID lịch hẹn', example: 1 })
  appointmentId: number;

  @ApiProperty({ description: 'Tên dịch vụ', example: 'Khám tim mạch' })
  serviceName: string;

  @ApiProperty({ description: 'Tên bệnh nhân', example: 'Nguyễn Văn A' })
  patientName: string;

  @ApiProperty({
    description: 'Trạng thái lịch hẹn',
    example: 'UPCOMING',
    enum: ['UPCOMING', 'ON_GOING', 'COMPLETED', 'CANCELLED'],
  })
  status: 'UPCOMING' | 'ON_GOING' | 'COMPLETED' | 'CANCELLED';

  @ApiProperty({ description: 'Thời gian bắt đầu thực tế (ISO format)', example: '2025-01-15T10:00:00.000Z' })
  startDateTime: Date;

  @ApiProperty({ description: 'Thời gian kết thúc thực tế (ISO format)', example: '2025-01-15T10:30:00.000Z' })
  endDateTime: Date;
}

export class WeeklyScheduleDayDto {
  @ApiProperty({
    description: 'Ngày trong tuần (ISO date format)',
    example: '2024-01-15',
  })
  date: string;

  @ApiProperty({
    description: 'Thứ trong tuần (0 = Chủ nhật, 1 = Thứ 2, ..., 6 = Thứ 7)',
    example: 1,
  })
  dayOfWeek: number;

  @ApiProperty({
    description: 'Tên ngày',
    example: 'Thứ 2',
  })
  dayName: string;

  @ApiProperty({
    description: 'Lịch làm việc cố định cho ngày này',
    type: DoctorAvailabilityDto,
    required: false,
    nullable: true,
  })
  availability: DoctorAvailabilityDto | null;

  @ApiProperty({
    description: 'Override cho ngày này (nếu có)',
    type: AvailabilityOverrideDto,
    required: false,
    nullable: true,
  })
  override: AvailabilityOverrideDto | null;

  @ApiProperty({
    description: 'Giờ làm việc thực tế (sau khi áp dụng override)',
    example: { startTime: '09:00', endTime: '18:00' },
    required: false,
    nullable: true,
  })
  actualSchedule: { startTime: string; endTime: string } | null;

  @ApiProperty({
    description: 'Có nghỉ không (override với startTime và endTime = null)',
    example: false,
  })
  isOff: boolean;

  @ApiProperty({
    description: 'Danh sách timeslot bận trong ngày',
    type: [BookedTimeSlotDto],
    required: false,
  })
  bookedTimeSlots: BookedTimeSlotDto[];
}

export class WeeklyScheduleResponseDto {
  @ApiProperty({ description: 'ID bác sĩ', example: 1 })
  doctorId: number;

  @ApiProperty({ description: 'Tên bác sĩ', example: 'Nguyễn Văn A' })
  doctorName: string;

  @ApiProperty({
    description: 'Ngày bắt đầu tuần (ISO date format)',
    example: '2024-01-15',
  })
  weekStartDate: string;

  @ApiProperty({
    description: 'Ngày kết thúc tuần (ISO date format)',
    example: '2024-01-21',
  })
  weekEndDate: string;

  @ApiProperty({
    description: 'Lịch làm việc theo từng ngày trong tuần',
    type: [WeeklyScheduleDayDto],
  })
  days: WeeklyScheduleDayDto[];
}

// Query DTO for getting monthly schedule
export const GetMonthlyScheduleQuerySchema = z.object({
  startDate: z.string().optional(), // ISO date string (YYYY-MM-DD)
  endDate: z.string().optional(), // ISO date string (YYYY-MM-DD)
});

export class GetMonthlyScheduleQueryDto extends createZodDto(
  GetMonthlyScheduleQuerySchema,
) {}

export class MonthlyScheduleResponseDto {
  @ApiProperty({ description: 'ID bác sĩ', example: 1 })
  doctorId: number;

  @ApiProperty({ description: 'Tên bác sĩ', example: 'Nguyễn Văn A' })
  doctorName: string;

  @ApiProperty({
    description: 'Ngày bắt đầu (ISO date format)',
    example: '2024-01-01',
  })
  startDate: string;

  @ApiProperty({
    description: 'Ngày kết thúc (ISO date format)',
    example: '2024-01-31',
  })
  endDate: string;

  @ApiProperty({
    description: 'Lịch làm việc theo từng ngày',
    type: [WeeklyScheduleDayDto],
  })
  days: WeeklyScheduleDayDto[];
}
