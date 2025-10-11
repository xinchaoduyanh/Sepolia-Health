import { ApiProperty } from '@nestjs/swagger';

export class DoctorProfileDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ nullable: true })
  deletedAt: Date | null;

  @ApiProperty()
  specialty: string;

  @ApiProperty({ nullable: true })
  experience: string | null;

  @ApiProperty({ nullable: true })
  contactInfo: string | null;

  @ApiProperty()
  userId: number;
}

export class UserProfileDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty({ nullable: true })
  phone?: string | null;

  @ApiProperty({ nullable: true })
  address?: string | null;

  @ApiProperty({ nullable: true })
  dateOfBirth?: Date | null;

  @ApiProperty({ nullable: true })
  gender?: string | null;

  @ApiProperty({ nullable: true })
  avatar?: string | null;

  @ApiProperty()
  role: string;

  @ApiProperty()
  isVerified: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class CreateDoctorProfileResponseDto extends DoctorProfileDto {}

export class GetDoctorProfileByServiceIdResponseDto extends DoctorProfileDto {
  @ApiProperty({ type: UserProfileDto })
  user: UserProfileDto;
}
