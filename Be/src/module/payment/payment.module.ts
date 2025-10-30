import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PrismaModule } from '@/common/prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from '@/common/modules/redis';

@Module({
  imports: [PrismaModule, ConfigModule, RedisModule],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
