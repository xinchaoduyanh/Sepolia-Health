import { Module, Global, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaModule } from '@/common/prisma/prisma.module';
import { CommonModule } from '@/common/common.module';
import { PrismaService } from '@/common/prisma/prisma.service';
import { NotificationUtils } from './notification.utils';

@Global()
@Module({
  imports: [PrismaModule, CommonModule],
  providers: [],
  exports: [],
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
