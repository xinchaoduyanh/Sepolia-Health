import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { TokenPayload } from '../types/jwt.type';

export const CurrentUser = createParamDecorator(
  (
    data: keyof TokenPayload | undefined,
    ctx: ExecutionContext,
  ): TokenPayload => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user;

    return data ? user?.[data] : (user as TokenPayload);
  },
);
