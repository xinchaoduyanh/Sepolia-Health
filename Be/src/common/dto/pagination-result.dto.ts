import { Type } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export class PaginationResponseDto<T> {
  @ApiProperty({ isArray: true })
  data: T[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export function createPaginateSwaggerType<T>(classRef: Type<T>) {
  class PaginateResponse extends PaginationResponseDto<T> {
    @ApiProperty({ type: [classRef] })
    declare data: T[];
  }
  return PaginateResponse;
}
