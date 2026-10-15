import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { buildKafkaConsumerOptions } from '@app/kafka-toolkit';
import { BillingServiceModule } from './billing-service.module';

async function bootstrap() {
  // Servicio puro de Kafka: no expone HTTP.
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    BillingServiceModule,
    buildKafkaConsumerOptions(
      process.env.KAFKA_CLIENT_ID ?? 'billing-service',
      process.env.KAFKA_GROUP_ID ?? 'billing-svc',
    ),
  );
  await app.listen();
}
bootstrap();
