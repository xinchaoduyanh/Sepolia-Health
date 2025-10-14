import { UnprocessableEntityException } from '@nestjs/common';
import { createZodValidationPipe, ZodValidationPipe } from 'nestjs-zod';
import { ZodError } from 'zod';

const CustomZodValidationPipe: typeof ZodValidationPipe =
  createZodValidationPipe({
    // provide custom validation exception factory
    createValidationException: (error: ZodError) => {
      const formattedErrors = error.issues.map((issue) => {
        return {
          ...issue,
          path: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
          received: issue,
        };
      });

      return new UnprocessableEntityException(formattedErrors);
    },
  });

export default CustomZodValidationPipe;
