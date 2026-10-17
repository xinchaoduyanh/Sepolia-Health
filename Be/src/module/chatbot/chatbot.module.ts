import { Module } from '@nestjs/common';
import { PrismaModule } from '@/common/prisma/prisma.module';
import { BullModule } from '@nestjs/bullmq';
import { AiPlatformClient } from './ai-platform-client.service';
import { CHATBOT_QUEUE } from './chatbot.constant';
import { ChatbotController } from './chatbot.controller';
import { ChatbotProcessor } from './chatbot.processor';
import { ChatbotService } from './chatbot.service';
import { DoctorScheduleTool } from './tools/doctor-schedule.tool';
import { FindAvailableDoctorsTool } from './tools/find-available-doctors.tool';
import { SearchClinicsTool } from './tools/search-clinics.tool';
import { SearchDoctorsTool } from './tools/search-doctors.tool';
import { SearchServicesTool } from './tools/search-services.tool';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({ name: CHATBOT_QUEUE.NAME }),
  ],
  controllers: [ChatbotController],
  providers: [
    AiPlatformClient,
    ChatbotService,
    ChatbotProcessor,
    DoctorScheduleTool,
    SearchDoctorsTool,
    SearchClinicsTool,
    SearchServicesTool,
    FindAvailableDoctorsTool,
  ],
  exports: [ChatbotService],
})
export class ChatbotModule {}
