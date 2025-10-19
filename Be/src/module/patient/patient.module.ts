import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { AppointmentModule } from './appointment/appointment.module';
import { DoctorModule } from './doctor/doctor.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    AuthModule,
    UserModule,
    AppointmentModule,
    DoctorModule,
    UploadModule,
  ],
  exports: [
    AuthModule,
    UserModule,
    AppointmentModule,
    DoctorModule,
    UploadModule,
  ],
})
export class PatientModule {}
