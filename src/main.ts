import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configurar prefijo global para la API
  app.setGlobalPrefix('api');

  // Configurar validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Configurar CORS
  app.enableCors();

  // Configurar Swagger
  const config = new DocumentBuilder()
    .setTitle('TripTailor API')
    .setDescription(
      'API REST para la plataforma TripTailor - Gestión de usuarios, actividades locales e itinerarios personalizados',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Ingresa el token JWT',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('auth', 'Autenticación - Registro y login de usuarios')
    .addTag('users', 'Usuarios - Gestión de perfiles de usuario')
    .addTag('cities', 'Ciudades - Información de ciudades disponibles')
    .addTag('activities', 'Actividades - Catálogo de actividades locales')
    .addTag('itineraries', 'Itinerarios - Creación y gestión de itinerarios personalizados')
    .addTag('health', 'Health - Verificación del estado del servicio')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Aplicación ejecutándose en: http://localhost:${port}`);
  console.log(`📚 Documentación Swagger en: http://localhost:${port}/api/docs`);
}

bootstrap();

