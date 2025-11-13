import { ApiProperty } from '@nestjs/swagger';

export class GetAppointmentDetailResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  date: Date;

  @ApiProperty()
  startTime: string;

  @ApiProperty()
  endTime: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  notes?: string | null;

  @ApiProperty()
  patientName?: string;

  @ApiProperty()
  patientDob?: Date;

  @ApiProperty()
  patientPhone?: string;

  @ApiProperty()
  patientGender?: string;
}
