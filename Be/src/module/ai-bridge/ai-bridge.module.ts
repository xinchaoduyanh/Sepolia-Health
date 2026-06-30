import { Module } from '@nestjs/common';
import { AiBridgeController } from './ai-bridge.controller';
import { AiBridgeService } from './ai-bridge.service';

@Module({
  controllers: [AiBridgeController],
  providers: [AiBridgeService],
})
export class AiBridgeModule {}
