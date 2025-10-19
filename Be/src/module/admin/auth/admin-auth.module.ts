import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';
import { PrismaModule } from '@/common/prisma/prisma.module';
import { appConfig } from '@/common/config';
import { ConfigType } from '@nestjs/config';

@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      inject: [appConfig.KEY],
      useFactory: async (jwtConf: ConfigType<typeof appConfig>) => ({
        secret: jwtConf.secret,
        signOptions: { expiresIn: jwtConf.expiresIn },
      }),
    }),
  ],
  controllers: [AdminAuthController],
  providers: [AdminAuthService],
  exports: [AdminAuthService],
})
export class AdminAuthModule {}
