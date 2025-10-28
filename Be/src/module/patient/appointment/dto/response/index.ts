import { ApiProperty } from '@nestjs/swagger';

export class PatientDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  phone: string | null;
}

export class UserDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;
}

export class DoctorDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  specialty: string;

  @ApiProperty({ type: UserDto })
  user: UserDto;
}

export class ServiceDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  duration: number;
}

export class AppointmentResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  date: string;

  @ApiProperty()
  startTime: string;

  @ApiProperty()
  endTime: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  paymentStatus: string;

  @ApiProperty()
  notes: string | null;

  @ApiProperty({ type: PatientDto })
  patient: PatientDto;

  @ApiProperty({ type: DoctorDto })
  doctor: DoctorDto;

  @ApiProperty({ type: ServiceDto })
  service: ServiceDto;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class AppointmentsListResponseDto {
  @ApiProperty({ type: [AppointmentResponseDto] })
  appointments: AppointmentResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}

export class WorkingHoursDto {
  @ApiProperty()
  startTime: string;

  @ApiProperty()
  endTime: string;
}

export class GetDoctorAvailabilityResponseDto {
  @ApiProperty()
  doctorId: number;

  @ApiProperty()
  doctorName: string;

  @ApiProperty()
  serviceName: string;

  @ApiProperty()
  serviceDuration: number;

  @ApiProperty()
  date: string;

  @ApiProperty({ type: WorkingHoursDto })
  workingHours: WorkingHoursDto;

  @ApiProperty({ type: [WorkingHoursDto] })
  availableTimeSlots: WorkingHoursDto[];
}

export class AvailableDateDto {
  @ApiProperty()
  date: string;

  @ApiProperty()
  dayOfWeek: number;

  @ApiProperty({ type: WorkingHoursDto })
  workingHours: WorkingHoursDto;
}

export class GetAvailabilityDateResponseDto {
  @ApiProperty()
  doctorId: number;

  @ApiProperty()
  doctorName: string;

  @ApiProperty()
  serviceName: string;

  @ApiProperty()
  serviceDuration: number;

  @ApiProperty({ type: [AvailableDateDto] })
  availableDates: AvailableDateDto[];
}
