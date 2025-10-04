import { ApiProperty } from '@nestjs/swagger';
import z, { ZodObject } from 'zod';

export function createZodDto<T extends ZodObject<any>>(schema: T) {
  type Shape = z.infer<T>;

  class ZodDto {
    constructor(input: any) {
      Object.assign(this, schema.parse(input));
    }
  }

  //add apiProperty for Swagger
  for (const key of Object.keys(schema.shape) as (keyof Shape)[]) {
    const shape = schema.shape[key];
    const swaggerType = getSwaggerType(shape);

    if (shape instanceof z.ZodArray || shape instanceof z.ZodEnum) {
      ApiProperty({
        ...swaggerType,
        required: !(shape instanceof z.ZodOptional),
      });
    } else {
      ApiProperty({
        type: swaggerType,
        required: !(shape instanceof z.ZodOptional),
      })(ZodDto.prototype, key as string);
    }
  }

  return ZodDto as new (input: any) => Shape;
}

function getSwaggerType(shape: any): any {
  if (shape instanceof z.ZodString || shape instanceof z.ZodEmail)
    return String;
  if (shape instanceof z.ZodNumber) return Number;
  if (shape instanceof z.ZodBoolean) return Boolean;
  if (shape instanceof z.ZodEnum) return { enum: shape.options };
  if (shape instanceof z.ZodArray) {
    const itemType = getSwaggerType(shape.element);
    return { type: itemType, isArray: true };
  }
  if (shape instanceof z.ZodObject) {
    // nested DTO: bạn cần tạo class riêng
    return () => createZodDto(shape); // lazy resolver để tránh circular dependency
  }
  return Object;
}
