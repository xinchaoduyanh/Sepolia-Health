import { Module } from '@nestjs/common';
import { AdminReceptionistController } from './admin-receptionist.controller';
import { AdminReceptionistService } from './admin-receptionist.service';
import { PrismaModule } from '@/common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminReceptionistController],
  providers: [AdminReceptionistService],
  exports: [AdminReceptionistService],
})
export class AdminReceptionistModule {}
