import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { ConfigModule } from '@nestjs/config';
import { appConfig } from '@/common/config';

@Module({
  imports: [ConfigModule.forFeature(appConfig)],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
