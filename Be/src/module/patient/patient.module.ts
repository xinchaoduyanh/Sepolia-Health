import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { AppointmentModule } from './appointment/appointment.module';
import { DoctorModule } from './doctor/doctor.module';
import { UploadModule } from './upload/upload.module';
import { PromotionModule } from './promotion/promotion.module';
import { FeedbackModule } from './feedback/feedback.module';
import { DoctorAppointmentModule } from './doctor-appointment/doctor-appointment.module';
import { PatientArticleModule } from './article/patient-article.module';

@Module({
  imports: [
    UserModule,
    AppointmentModule,
    DoctorModule,
    UploadModule,
    PromotionModule,
    FeedbackModule,
    DoctorAppointmentModule,
    PatientArticleModule,
  ],
  exports: [
    UserModule,
    AppointmentModule,
    DoctorModule,
    UploadModule,
    PromotionModule,
    FeedbackModule,
    DoctorAppointmentModule,
    PatientArticleModule,
  ],
})
export class PatientModule {}
