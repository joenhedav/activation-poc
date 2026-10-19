import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { buildKafkaConsumerOptions } from '@app/kafka-toolkit';
import { ProvisioningServiceModule } from './provisioning-service.module';

async function bootstrap() {
  // Servicio puro de Kafka: no expone HTTP.
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    ProvisioningServiceModule,
    buildKafkaConsumerOptions(
      process.env.KAFKA_CLIENT_ID ?? 'provisioning-service',
      process.env.KAFKA_GROUP_ID ?? 'provisioning-svc',
    ),
  );
  await app.listen();
}
bootstrap();
