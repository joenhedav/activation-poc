import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { buildKafkaConsumerOptions } from '@app/kafka-toolkit';
import { LoyaltyServiceModule } from './loyalty-service.module';

async function bootstrap() {
  // Consumidor nuevo (escenario 5): su grupo es nuevo, así que lee todo el historial.
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    LoyaltyServiceModule,
    buildKafkaConsumerOptions(
      process.env.KAFKA_CLIENT_ID ?? 'loyalty-service',
      process.env.KAFKA_GROUP_ID ?? 'loyalty',
    ),
  );
  await app.listen();
}
bootstrap();
