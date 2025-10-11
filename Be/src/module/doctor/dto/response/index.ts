import { ApiProperty } from '@nestjs/swagger';

export class getTimeslotByDoctorIdAndDayResponseDto {
  @ApiProperty()
  day: Date;

  @ApiProperty()
  morningSlot: number;

  @ApiProperty()
  afternoonSlot: number;
}

export class GetDoctorServiceResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  duration: number;

  @ApiProperty()
  description: string;
}
