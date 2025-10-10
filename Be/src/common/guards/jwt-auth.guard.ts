import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      this.logger.debug('Route is public, skipping authentication');
      return true;
    }

    this.logger.debug(
      'Route requires authentication, proceeding with JWT validation',
    );
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    // Log authentication errors for debugging
    if (err) {
      this.logger.debug(`Authentication error: ${err.message}`);
      this.logger.debug(`Error details:`, err);
      throw err;
    }

    if (!user) {
      // Log specific authentication failure reasons
      if (info) {
        this.logger.debug(
          `Authentication failed: ${info.message || 'Unknown reason'}`,
        );
        this.logger.debug(`Info details:`, info);
      } else {
        this.logger.debug(
          'Authentication failed: No user and no info provided',
        );
      }
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
    }

    this.logger.debug(`Authentication successful for user: ${user.userId}`);
    return user;
  }
}
