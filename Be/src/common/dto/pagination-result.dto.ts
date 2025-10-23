import { Type } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

// use this class in return of controller or service
// ex: Promise<PaginationResponseDto<GetDoctorServiceResponseDto>>
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

// use this func in swagger as type
// ex: @ApiResponse({ status: HttpStatus.OK, type: createPaginateSwaggerType(GetDoctorServiceResponseDto) })
export function createPaginateSwaggerType<T>(classRef: Type<T>) {
  class PaginateResponse extends PaginationResponseDto<T> {
    @ApiProperty({ type: [classRef] })
    declare data: T[];
  }
  return PaginateResponse;
}
