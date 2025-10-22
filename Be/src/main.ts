import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ResponseInterceptor } from '@/common/interceptors';
import { AppModule } from './module/app.module';
import { HttpExceptionsFilter } from './common/exceptions';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Global prefix
  app.setGlobalPrefix('api');

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionsFilter());

  // Global response interceptor
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Enable CORS - Allow all origins for development
  app.enableCors({
    origin: true, // Allow all origins
    credentials: true,
  });

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Sepolia Clinic API')
    .setDescription('API documentation for Sepolia Clinic Management System')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT || 8000;
  await app.listen(port);

  // logger.log(`🚀 Application is running on: http://localhost:${port}/api`);
  logger.log(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`);
}
bootstrap();
