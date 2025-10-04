import { ApiProperty } from '@nestjs/swagger';
import { ZodObject, ZodRawShape, ZodType } from 'zod';

export function createZodDto<T extends ZodObject<ZodRawShape>>(schema: T) {
  class ZodDto {
    constructor(input: any) {
      const parsed = schema.parse(input);
      Object.assign(this, parsed);
    }
  }

  //add apiProperty for Swagger
  for (const [key, prop] of Object.entries(schema.shape)) {
    Object.defineProperty(ZodDto.prototype, key, {
      writable: true,
      enumerable: true,
      configurable: true,
    });

    ApiProperty()(ZodDto.prototype, key);
  }

  return ZodDto as {
    new (...args: any[]): {
      [K in keyof (typeof schema)['shape']]: any;
    };
  };
}
