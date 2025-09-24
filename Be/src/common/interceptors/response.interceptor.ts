import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';
import { RESPONSE_METADATA_KEY } from '../decorators/response.decorator';
import { BaseResponseDto } from '../dto/common-response.dto';

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, BaseResponseDto<T>>
{
  constructor(private reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<BaseResponseDto<T>> {
    const responseMetadata = this.reflector.getAllAndOverride(
      RESPONSE_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );

    return next.handle().pipe(
      map((data) => {
        const response = context.switchToHttp().getResponse<Response>();

        // Nếu có metadata từ decorator
        if (responseMetadata) {
          const { status, message } = responseMetadata;

          // Set status code
          response.status(status as HttpStatus);

          return {
            data,
            message: message || this.getDefaultMessage(status as HttpStatus),
            statusCode: status,
          };
        }

        // Default response
        return {
          data,
          message: 'Success',
          statusCode: 200,
        };
      }),
    );
  }

  private getDefaultMessage(status: number): string {
    const messages = {
      200: 'Success',
      201: 'Created successfully',
      202: 'Accepted',
      204: 'No content',
    };
    return messages[status] || 'Success';
  }
}
