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
    let shouldLogStack = false;

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

      // Only log stack trace for 5xx errors or specific client errors
      shouldLogStack = status >= 500 || status === 401 || status === 403;
    } else {
      // Handle non-HTTP exceptions
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      error = 'InternalServerError';
      shouldLogStack = true;
    }

    // Create log message
    const logMessage = `${request.method} ${request.url} - ${status} - ${message as string}`;

    // Log based on status code
    if (status >= 500) {
      this.logger.error(
        logMessage,
        shouldLogStack && exception instanceof Error
          ? exception.stack
          : undefined,
      );
    } else if (status >= 400) {
      this.logger.warn(logMessage);
    } else {
      this.logger.log(logMessage);
    }

    // Create response
    const errorResponse = {
      success: false,
      message: message as string,
      statusCode: status,
      data: null,
    };

    // Add additional fields for development
    if (process.env.NODE_ENV === 'development') {
      (errorResponse as any).error = error;
      (errorResponse as any).timestamp = new Date().toISOString();
      (errorResponse as any).path = request.url;

      // Only include stack trace in development for 5xx errors
      if (status >= 500 && exception instanceof Error) {
        (errorResponse as any).stack = exception.stack;
      }
    }

    response.status(status).json(errorResponse);
  }
}
