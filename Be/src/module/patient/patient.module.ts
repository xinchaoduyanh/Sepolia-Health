import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { AppointmentModule } from './appointment/appointment.module';

@Module({
  imports: [AuthModule, AppointmentModule],
  exports: [AuthModule, AppointmentModule],
})
export class PatientModule {}
