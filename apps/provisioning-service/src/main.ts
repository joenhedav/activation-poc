import { NestFactory } from '@nestjs/core';
import { ProvisioningServiceModule } from './provisioning-service.module';

async function bootstrap() {
  const app = await NestFactory.create(ProvisioningServiceModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
