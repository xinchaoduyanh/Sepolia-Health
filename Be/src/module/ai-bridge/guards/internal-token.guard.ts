import { appConfig } from '@/common/config';
import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';

/**
 * Chỉ cho phép request mang đúng X-Internal-Token (AI/ -> Be/ bridge).
 * Bridge routes phải @Public() để bỏ qua JwtAuthGuard; guard này thay thế auth.
 */
@Injectable()
export class InternalTokenGuard implements CanActivate {
  constructor(
    @Inject(appConfig.KEY)
    private readonly config: ConfigType<typeof appConfig>,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const token = req.headers['x-internal-token'];
    if (!token || token !== this.config.aiInternalToken) {
      throw new UnauthorizedException('Invalid X-Internal-Token');
    }
    return true;
  }
}
