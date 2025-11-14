import { Module, Global, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaModule } from '@/common/prisma/prisma.module';
import { CommonModule } from '@/common/common.module';
import { PrismaService } from '@/common/prisma/prisma.service';
import { NotificationUtils } from './notification.utils';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';

@Global()
@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    const streamChatConf = this.configService.get('app');
    NotificationUtils.initialize(streamChatConf, this.prisma);
    console.log(
      '[NotificationUtils] initialized at NotificationModule.onModuleInit',
    );
  }
}
