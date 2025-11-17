import { Module } from '@nestjs/common';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { DoctorScheduleTool } from './tools/doctor-schedule.tool';
import { HealthAdviceTool } from './tools/health-advice.tool';

@Module({
  controllers: [ChatbotController],
  providers: [ChatbotService, DoctorScheduleTool, HealthAdviceTool],
  exports: [ChatbotService],
})
export class ChatbotModule {}
