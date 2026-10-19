import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { buildKafkaConsumerOptions } from '@app/kafka-toolkit';
import { NotificationServiceModule } from './notification-service.module';

async function bootstrap() {
  // Servicio puro de Kafka: no expone HTTP.
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    NotificationServiceModule,
    buildKafkaConsumerOptions(
      process.env.KAFKA_CLIENT_ID ?? 'notification-service',
      process.env.KAFKA_GROUP_ID ?? 'notification-svc',
    ),
  );
  await app.listen();
}
bootstrap();
