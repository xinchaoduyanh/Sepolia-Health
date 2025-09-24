import { HttpException, HttpStatus } from '@nestjs/common';

export class BusinessException extends HttpException {
  constructor(
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    error?: string,
  ) {
    super(
      {
        message,
        error: error || 'BusinessError',
        statusCode: status,
      },
      status,
    );
  }
}

export class ValidationException extends BusinessException {
  constructor(message: string, errors?: any[]) {
    super(message, HttpStatus.UNPROCESSABLE_ENTITY, 'ValidationError');

    if (errors) {
      (this.getResponse() as any).errors = errors;
    }
  }
}

export class NotFoundException extends BusinessException {
  constructor(resource: string, id?: string | number) {
    const message = id
      ? `${resource} with id ${id} not found`
      : `${resource} not found`;
    super(message, HttpStatus.NOT_FOUND, 'NotFoundError');
  }
}

export class UnauthorizedException extends BusinessException {
  constructor(message: string = 'Unauthorized') {
    super(message, HttpStatus.UNAUTHORIZED, 'UnauthorizedError');
  }
}

export class ForbiddenException extends BusinessException {
  constructor(message: string = 'Forbidden') {
    super(message, HttpStatus.FORBIDDEN, 'ForbiddenError');
  }
}

export class ConflictException extends BusinessException {
  constructor(message: string) {
    super(message, HttpStatus.CONFLICT, 'ConflictError');
  }
}

export class TooManyRequestsException extends BusinessException {
  constructor(message: string = 'Too many requests') {
    super(message, HttpStatus.TOO_MANY_REQUESTS, 'TooManyRequestsError');
  }
}
