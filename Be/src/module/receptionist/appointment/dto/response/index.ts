import { ApiProperty } from '@nestjs/swagger';
import { AppointmentStatus, Gender, Relationship } from '@prisma/client';

export class PatientProfileDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  dateOfBirth: string;

  @ApiProperty({ enum: Gender })
  gender: Gender;

  @ApiProperty()
  phone: string;

  @ApiProperty({ enum: Relationship })
  relationship: Relationship;

  @ApiProperty({ required: false })
  avatar?: string;

  @ApiProperty({ required: false })
  idCardNumber?: string;

  @ApiProperty({ required: false })
  occupation?: string;

  @ApiProperty({ required: false })
  nationality?: string;

  @ApiProperty({ required: false })
  address?: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

export class FindPatientResponseDto {
  @ApiProperty()
  found: boolean;

  @ApiProperty({ required: false })
  user?: {
    id: number;
    email: string;
    phone?: string;
    status: string;
    role: string;
  };

  @ApiProperty({ type: [PatientProfileDto], required: false })
  patientProfiles?: PatientProfileDto[];
}

export class CreatePatientAccountResponseDto {
  @ApiProperty()
  user: {
    id: number;
    email: string;
    phone?: string;
    status: string;
    role: string;
  };

  @ApiProperty()
  patientProfile: PatientProfileDto;

  @ApiProperty()
  temporaryPassword: string;
}

export class CreateAppointmentResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  startTime: string;

  @ApiProperty()
  endTime: string;

  @ApiProperty()
  status: string;

  @ApiProperty({ required: false })
  notes?: string;

  @ApiProperty()
  patientProfile: {
    id: number;
    firstName: string;
    lastName: string;
    phone: string;
  };

  @ApiProperty()
  doctor: {
    id: number;
    firstName: string;
    lastName: string;
  };

  @ApiProperty()
  service: {
    id: number;
    name: string;
    price: number;
    duration: number;
  };

  @ApiProperty({ required: false })
  clinic?: {
    id: number;
    name: string;
  };

  @ApiProperty({ required: false })
  billing?: {
    id: number;
    amount: number;
    status: string;
    paymentMethod: string | null;
  };

  @ApiProperty()
  createdAt: string;
}

export class AppointmentsListResponseDto {
  @ApiProperty({ type: [CreateAppointmentResponseDto] })
  data: CreateAppointmentResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class AppointmentSummaryResponseDto {
  @ApiProperty({
    enum: AppointmentStatus,
  })
  appointmentStatus: AppointmentStatus;

  @ApiProperty()
  count: number;
}

