import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { CommonModule } from '@/common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [UserController],
  providers: [UserService, UserRepository],
})
export class UserModule {}
