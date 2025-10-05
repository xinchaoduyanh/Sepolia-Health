import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string | object;
    let error: string;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = exception.name;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || exception.message;
        error = responseObj.error || exception.name;
      } else {
        message = exception.message;
        error = exception.name;
      }
    } else {
      // Handle non-HTTP exceptions
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      error = 'InternalServerError';
    }

    // Log the exception
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message as string}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    // Create response
    const errorResponse = {
      data: null,
      message: message as string,
      statusCode: status,
    };

    // Add error field for development
    if (process.env.NODE_ENV === 'development') {
      (errorResponse as any).error = error;
      (errorResponse as any).timestamp = new Date().toISOString();
      (errorResponse as any).path = request.url;
    }

    response.status(status).json(errorResponse);
  }
}
