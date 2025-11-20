import { Module } from '@nestjs/common';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { DoctorScheduleTool } from './tools/doctor-schedule.tool';
import { SearchDoctorsTool } from './tools/search-doctors.tool';
import { SearchClinicsTool } from './tools/search-clinics.tool';
import { SearchServicesTool } from './tools/search-services.tool';
import { FindAvailableDoctorsTool } from './tools/find-available-doctors.tool';
import { PrismaModule } from '@/common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ChatbotController],
  providers: [
    ChatbotService,
    DoctorScheduleTool,
    SearchDoctorsTool,
    SearchClinicsTool,
    SearchServicesTool,
    FindAvailableDoctorsTool,
  ],
  exports: [ChatbotService],
})
export class ChatbotModule {}
