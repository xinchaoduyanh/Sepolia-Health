import { HttpStatus, SetMetadata } from '@nestjs/common';

export type ResponseOptions = {
  status?: HttpStatus;
  message?: string | object;
};

export const RESPONSE_METADATA_KEY = 'response_metadata';

export const ApiResponse = (options: ResponseOptions = {}) => {
  return SetMetadata(RESPONSE_METADATA_KEY, {
    status: options.status || HttpStatus.OK,
    message: options.message,
  });
};

export const ApiResponseOk = (message?: string | object) =>
  ApiResponse({ status: HttpStatus.OK, message });
export const ApiResponseCreated = (message?: string | object) =>
  ApiResponse({ status: HttpStatus.CREATED, message });
export const ApiResponseAccepted = (message?: string | object) =>
  ApiResponse({ status: HttpStatus.ACCEPTED, message });
export const ApiResponseNoContent = () =>
  ApiResponse({ status: HttpStatus.NO_CONTENT });
