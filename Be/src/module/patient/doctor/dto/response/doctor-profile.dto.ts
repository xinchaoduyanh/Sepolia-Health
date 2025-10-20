import { ApiProperty } from '@nestjs/swagger';
import { Role, UserStatus } from '@prisma/client';

export class DoctorProfileDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

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

  @ApiProperty({ nullable: true })
  phone?: string | null;

  @ApiProperty({ enum: Role })
  role: Role;

  @ApiProperty({ enum: UserStatus })
  status: UserStatus;

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
