import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { buildKafkaConsumerOptions } from '@app/kafka-toolkit';
import { CrmAnalyticsServiceModule } from './crm-analytics-service.module';

async function bootstrap() {
  // Servicio puro de Kafka: solo escucha, no publica nada.
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    CrmAnalyticsServiceModule,
    buildKafkaConsumerOptions(
      process.env.KAFKA_CLIENT_ID ?? 'crm-analytics-service',
      process.env.KAFKA_GROUP_ID ?? 'crm-analytics',
    ),
  );
  await app.listen();
}
bootstrap();
