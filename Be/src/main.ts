import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionsFilter } from '@/common/filters';
import { ResponseInterceptor } from '@/common/interceptors';
import { CustomZodValidationPipe } from '@/common/pipes';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from '@/common/guards';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionsFilter());

  // Global response interceptor
  app.useGlobalInterceptors(new ResponseInterceptor(new Reflector()));

  // Global validation pipe
  app.useGlobalPipes(new CustomZodValidationPipe());

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'access-token'],
    credentials: true,
  });

  // Global guards (optional - uncomment if you want global auth)
  app.useGlobalGuards(new JwtAuthGuard(new Reflector()));

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Sepolia Clinic API')
    .setDescription('API documentation for Sepolia Clinic Management System')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Appointments', 'Appointment management')
    .addTag('Users', 'User management')
    .addTag('Doctors', 'Doctor management')
    .addTag('Patients', 'Patient management')
    .addTag('Services', 'Service management')
    .addTag('Medicines', 'Medicine management')
    .addTag('Prescriptions', 'Prescription management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}/api/v1`);
  logger.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`);
  logger.log(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
}
bootstrap();
