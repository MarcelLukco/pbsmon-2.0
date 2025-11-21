import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/modules/app/app.module';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { AppConfig } from './config/app.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  const frontendUrl = process.env.FRONTEND_URL;
  const allowedOrigins = frontendUrl
    ? frontendUrl.split(',').map((url) => url.trim())
    : [
        'http://localhost:4200',
        'http://localhost:5173',
        'http://localhost:3000',
      ];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // In development, allow all localhost origins
        if (
          process.env.NODE_ENV !== 'production' &&
          origin.startsWith('http://localhost:')
        ) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalFilters(new GlobalExceptionFilter());

  const configService = app.get(ConfigService);
  const appConfig = configService.get<AppConfig>('app')!;
  const port = appConfig.port || 3000;

  // Swagger configuration - setup before global prefix
  const config = new DocumentBuilder()
    .setTitle('PBSMON API')
    .setDescription('API for showing data from Metacentrum computing grid')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Set global prefix for all routes (after Swagger document creation)
  app.setGlobalPrefix('api');

  // Swagger at /api/docs (global prefix + docs path)
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}/api`);
  console.log(`📚 Swagger UI available at: http://localhost:${port}/api/docs`);
}
bootstrap();
