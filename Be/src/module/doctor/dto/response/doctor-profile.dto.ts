import { ApiProperty } from '@nestjs/swagger';

export class DoctorProfileDto {
  @ApiProperty()
  id: string;

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

  @ApiProperty({ nullable: true })
  workingHours: string | null;

  @ApiProperty()
  userId: number;
}
