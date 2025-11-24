import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { AppointmentModule } from './appointment/appointment.module';
import { DoctorModule } from './doctor/doctor.module';
import { UploadModule } from './upload/upload.module';
import { PromotionModule } from './promotion/promotion.module';

@Module({
  imports: [
    UserModule,
    AppointmentModule,
    DoctorModule,
    UploadModule,
    PromotionModule,
  ],
  exports: [
    UserModule,
    AppointmentModule,
    DoctorModule,
    UploadModule,
    PromotionModule,
  ],
})
export class PatientModule {}
