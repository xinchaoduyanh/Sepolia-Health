import { Module } from '@nestjs/common';
import { DoctorScheduleModule } from './schedule/doctor-schedule.module';
import { DoctorAppointmentModule } from './doctor-appointment/doctor-appointment.module';

@Module({
  imports: [DoctorScheduleModule, DoctorAppointmentModule],
  exports: [DoctorScheduleModule, DoctorAppointmentModule],
})
export class DoctorModule {}
