import { Module } from '@nestjs/common';
import { DoctorScheduleModule } from './schedule/doctor-schedule.module';

@Module({
  imports: [DoctorScheduleModule],
  exports: [DoctorScheduleModule],
})
export class DoctorModule {}


