import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from '@/common/prisma/prisma.module';
import { CommonModule } from '@/common/common.module';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { PatientModule } from './patient/patient.module';
import { AdminModule } from './admin/admin.module';
import { ReceptionistModule } from './receptionist/receptionist.module';
import { CustomZodValidationPipe } from '@/common/pipes';
import { appConfig } from '@/common/config';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import { AuthModule } from './auth/auth.module';
import { PaymentModule } from './payment/payment.module';
import { ChatModule } from '@/module/chat/chat.module';
import { NotificationModule } from '@/module/notification/notification.module';
import { QnaModule } from '@/module/qna/qna.module';
import { ChatbotModule } from '@/module/chatbot/chatbot.module';
import { BullModule } from '@nestjs/bullmq';
import IORedis from 'ioredis';
import { MeetingModule } from './meeting/meeting.module';
import { DoctorModule } from './doctor/doctor.module';
import { AppTermsModule } from './app-terms/app-terms.module';
import { UserStatusGuard } from '@/common/guards/user-status.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [appConfig],
    }),
    CommonModule,
    BullModule.forRootAsync({
      imports: [CommonModule],
      useFactory: (redisClient: IORedis) => ({
        connection: redisClient,
      }),
      inject: ['REDIS_CLIENT'],
    }),
    PrismaModule,
    AuthModule,
    PatientModule,
    AdminModule,
    ReceptionistModule,
    DoctorModule,
    PaymentModule,
    ChatModule,
    NotificationModule,
    QnaModule,
    ChatbotModule,
    MeetingModule,
    AppTermsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useClass: CustomZodValidationPipe,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: UserStatusGuard,
    },
  ],
})
export class AppModule {}
