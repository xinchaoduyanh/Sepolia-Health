export class BaseResponseDto<T = any> {
  data: T;
  message: string;
  statusCode: number;
}
