import { ApiProperty } from '@nestjs/swagger';
import { Period } from '@prisma/client';

export class getTimeslotByDoctorIdAndDayResponseDto {
  //   @ApiProperty()
  //   id: number;

  @ApiProperty()
  day: Date;

  @ApiProperty()
  morningSlot: number;

  @ApiProperty()
  afternoonSlot: number;
}
