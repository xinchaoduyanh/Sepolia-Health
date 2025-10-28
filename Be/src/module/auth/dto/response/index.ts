import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;
}

export class RegisterResponseDto {
  @ApiProperty()
  email: string;
}

export class UserDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  role: string;
}

export class CompleteRegisterResponseDto {
  @ApiProperty({ type: UserDto })
  user: UserDto;
}

// Me endpoint DTOs
export class DoctorProfileDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty({ required: false })
  dateOfBirth?: Date;

  @ApiProperty({ required: false })
  gender?: string;

  @ApiProperty({ required: false })
  avatar?: string;

  @ApiProperty()
  specialty: string;

  @ApiProperty({ required: false })
  experience?: string;

  @ApiProperty({ required: false })
  contactInfo?: string;
}

export class ReceptionistProfileDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty({ required: false })
  dateOfBirth?: Date;

  @ApiProperty({ required: false })
  gender?: string;

  @ApiProperty({ required: false })
  avatar?: string;

  @ApiProperty({ required: false })
  shift?: string;
}

export class AdminProfileDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty({ required: false })
  dateOfBirth?: Date;

  @ApiProperty({ required: false })
  gender?: string;

  @ApiProperty({ required: false })
  avatar?: string;
}

export class PatientProfileDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  dateOfBirth: Date;

  @ApiProperty()
  gender: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  relationship: string;

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
}

export class MeResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  email: string;

  @ApiProperty({ required: false })
  phone?: string;

  @ApiProperty()
  role: string;

  @ApiProperty()
  status: string;

  @ApiProperty({ required: false })
  doctorProfile?: DoctorProfileDto;

  @ApiProperty({ required: false, type: [PatientProfileDto] })
  patientProfiles?: PatientProfileDto[];

  @ApiProperty({ required: false })
  receptionistProfile?: ReceptionistProfileDto;

  @ApiProperty({ required: false })
  adminProfile?: AdminProfileDto;
}
