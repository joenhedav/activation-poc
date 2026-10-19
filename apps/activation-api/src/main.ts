import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { buildKafkaConsumerOptions } from '@app/kafka-toolkit';
import { ActivationApiModule } from './activation-api.module';

async function bootstrap() {
  const app = await NestFactory.create(ActivationApiModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors(); // la demo-ui corre en otro puerto (5173)

  // App híbrida: HTTP + consumidor Kafka (el agregador de la saga).
  app.connectMicroservice<MicroserviceOptions>(
    buildKafkaConsumerOptions(
      process.env.KAFKA_CLIENT_ID ?? 'activation-api',
      process.env.KAFKA_GROUP_ID ?? 'activation-api',
    ),
  );
  await app.startAllMicroservices();

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
}
bootstrap();
