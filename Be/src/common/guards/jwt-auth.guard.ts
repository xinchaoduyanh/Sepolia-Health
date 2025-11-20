import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthRepository } from '@/module/auth/auth.repository';
import { UserStatus } from '@prisma/client';
import { ERROR_MESSAGES } from '@/common/constants/error-messages';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private reflector: Reflector,
    private authRepository: AuthRepository,
  ) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Get request information for logging
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;
    const route = `${method} ${url}`;

    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      this.logger.log(`API Called: ${route} (Public)`);
      return true;
    }

    this.logger.log(`API Called: ${route} (Protected)`);
    return super.canActivate(context);
  }

  async handleRequest(err: any, user: any, info: any) {
    // Handle authentication errors
    if (err) {
      this.logger.error(`Authentication error: ${err.message}`);
      throw err;
    }

    if (!user) {
      // Log authentication failure
      if (info) {
        this.logger.warn(
          `Authentication failed: ${info.message || 'Unknown reason'}`,
        );
      } else {
        this.logger.warn('Authentication failed: No user and no info provided');
      }
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
    }

    // Check if user is DEACTIVE
    try {
      const dbUser = await this.authRepository.findById(user.userId);
      if (dbUser && dbUser.status === UserStatus.DEACTIVE) {
        throw new ForbiddenException(ERROR_MESSAGES.AUTH.USER_DEACTIVE);
      }
    } catch (error) {
      // If it's already a ForbiddenException, re-throw it
      if (error instanceof ForbiddenException) {
        throw error;
      }
      // For other errors (e.g., user not found), log but don't block
      this.logger.warn(`Failed to check user status: ${error.message}`);
    }

    return user;
  }
}
