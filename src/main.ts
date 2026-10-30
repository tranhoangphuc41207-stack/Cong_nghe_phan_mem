import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Cho phép web (Frontend) ở địa chỉ khác gọi API từ trình duyệt.
  // Cần thêm địa chỉ nào thì thêm vào danh sách origin.
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5173',
      'http://localhost:4200',
    ],
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  const config = new DocumentBuilder()
    .setTitle('AR-IMMS API')
    .setDescription('API quản lý hạ tầng máy chủ')
    .setVersion('1.0')
    .addBearerAuth()
    .addSecurityRequirements('bearer')
    .build();
  SwaggerModule.setup('api', app, SwaggerModule.createDocument(app, config), {
    swaggerOptions: { persistAuthorization: true },
  });

  // 0.0.0.0: nhận kết nối từ máy khác trong mạng, không chỉ localhost
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
