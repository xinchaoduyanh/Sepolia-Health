import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ResponseInterceptor } from '@/common/interceptors';
import { AppModule } from './module/app.module';
import { HttpExceptionsFilter } from './common/exceptions';

async function bootstrap() {
  // rawBody: true để verify chữ ký webhook Stream Chat trên đúng bytes gốc.
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const logger = new Logger('Bootstrap');

  // Tắt header x-powered-by
  app.getHttpAdapter().getInstance().disable('x-powered-by');

  // Global prefix
  app.setGlobalPrefix('api');

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionsFilter());

  // Global response interceptor
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Cấu hình CORS
  const corsOriginsEnv = process.env.CORS_ORIGINS;
  if (corsOriginsEnv) {
    const origins = corsOriginsEnv
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
    app.enableCors({
      origin: origins,
      credentials: true,
    });
    logger.log(`🌐 CORS enabled for origins: ${origins.join(', ')}`);
  } else {
    app.enableCors({
      origin: true,
      credentials: true,
    });
    logger.warn(
      '⚠️ CORS_ORIGINS chưa được cấu hình. Đang cho phép tất cả các origin (vui lòng cấu hình CORS_ORIGINS cho production)',
    );
  }

  // Swagger setup - chỉ bật khi không phải production hoặc SWAGGER_ENABLED === 'true'
  const isProduction = process.env.NODE_ENV === 'production';
  const isSwaggerEnabled = process.env.SWAGGER_ENABLED === 'true';

  if (!isProduction || isSwaggerEnabled) {
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
    logger.log('📚 Swagger documentation enabled at: /api/docs');
  } else {
    logger.log('📚 Swagger documentation disabled in production');
  }

  const port = process.env.PORT || 8000;
  await app.listen(port);

  // logger.log(`🚀 Application is running on: http://localhost:${port}/api`);
  logger.log(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
  if (!isProduction || isSwaggerEnabled) {
    logger.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`);
  }
}
bootstrap();
