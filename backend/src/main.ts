import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ['http://localhost:3001', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  });
  const port = parseInt(process.env.PORT || '3003', 10);
  const host = process.env.HOST || '0.0.0.0';
  await app.listen(port, host);
}
bootstrap();
