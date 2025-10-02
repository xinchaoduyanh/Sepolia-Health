import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor() {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const accessToken =
      req.headers['access_token'] ||
      req.headers['access-token'] ||
      req.headers['authorization'];
    if (!accessToken) {
      throw new UnauthorizedException('Missing access_token in header');
    }
    //handle tiếp dưới nayuf
    return true;
  }
}
