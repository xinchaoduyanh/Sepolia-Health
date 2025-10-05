import { Type } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export class PaginationResultDto<T> {
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

export function PaginatedDto<T>(classRef: Type<T>) {
  class PaginateResponse extends PaginationResultDto<T> {
    @ApiProperty({ type: [classRef] })
    declare data: T[];
  }
  return PaginateResponse;
}
