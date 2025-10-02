import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { AppointmentModule } from './appointment/appointment.module';

@Module({
  imports: [AuthModule, UserModule, AppointmentModule],
  exports: [AuthModule, UserModule, AppointmentModule],
})
export class PatientModule {}
