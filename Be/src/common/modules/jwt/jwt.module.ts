import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CustomJwtService } from './jwt.service';
import { ConfigService } from '../../config';

@Module({
  imports: [
    JwtModule.register({}), // JWT module sẽ được config trong service
  ],
  providers: [CustomJwtService, ConfigService],
  exports: [CustomJwtService],
})
export class JwtAuthModule {}
