import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ActivationApiModule } from './activation-api.module';

async function bootstrap() {
  const app = await NestFactory.create(ActivationApiModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors(); // la demo-ui corre en otro puerto (5173)

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
}
bootstrap();
