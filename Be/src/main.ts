import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ResponseInterceptor } from '@/common/interceptors';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from '@/common/guards';
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
  app.useGlobalInterceptors(new ResponseInterceptor(new Reflector()));

  // Enable CORS with specific configuration for mobile app
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:8081', // Expo dev server
      'http://localhost:19006', // Expo web
      'exp://192.168.1.100:8081', // Expo tunnel (replace with your IP)
      'exp://localhost:8081',
      /^exp:\/\/.*\.ngrok\.io$/, // Ngrok tunnels
      /^https:\/\/.*\.ngrok\.io$/, // Ngrok HTTPS tunnels
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
    ],
    credentials: true,
  });

  // Global guards (optional - uncomment if you want global auth)
  app.useGlobalGuards(new JwtAuthGuard(new Reflector()));

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

  const port = process.env.PORT || 3000;
  await app.listen(port);

  // logger.log(`🚀 Application is running on: http://localhost:${port}/api`);
  logger.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`);
  logger.log(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
}
bootstrap();
