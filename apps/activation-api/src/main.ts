import { NestFactory } from '@nestjs/core';
import { ActivationApiModule } from './activation-api.module';

async function bootstrap() {
  const app = await NestFactory.create(ActivationApiModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
