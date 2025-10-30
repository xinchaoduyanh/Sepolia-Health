import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
  Inject,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { appConfig } from '@/common/config';

@Injectable()
export class SepayApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(SepayApiKeyGuard.name);

  constructor(
    @Inject(appConfig.KEY)
    private readonly sepayConf: ConfigType<typeof appConfig>,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      this.logger.warn('Missing Authorization header in SEPAY webhook');
      throw new UnauthorizedException('Missing Authorization header');
    }

    // Check if header starts with "Apikey "
    if (!authHeader.startsWith('Apikey ')) {
      this.logger.warn(
        'Invalid Authorization header format - must start with "Apikey "',
      );
      throw new UnauthorizedException('Invalid Authorization header format');
    }

    // Extract API key from header
    const providedApiKey = authHeader.substring(7); // Remove "Apikey " prefix
    const expectedApiKey = this.sepayConf.sepayApiKey;

    if (!expectedApiKey) {
      this.logger.error('SEPAY_API_KEY not configured in environment');
      throw new UnauthorizedException('Server configuration error');
    }

    if (providedApiKey !== expectedApiKey) {
      console.log('providedApiKey', providedApiKey);
      console.log('expectedApiKey', expectedApiKey);
      this.logger.warn('Invalid SEPAY API key provided');
      throw new UnauthorizedException('Invalid API key');
    }

    this.logger.log('SEPAY webhook authentication successful');
    return true;
  }
}
