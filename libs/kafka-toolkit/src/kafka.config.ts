import { MicroserviceOptions, Transport } from '@nestjs/microservices';

/** Token de inyección del cliente Kafka (solo para publicar). */
export const KAFKA_CLIENT = 'KAFKA_CLIENT';

/** Lee KAFKA_BROKERS (lista separada por comas). */
export function getBrokers(): string[] {
  return (process.env.KAFKA_BROKERS ?? 'localhost:9092')
    .split(',')
    .map((b) => b.trim())
    .filter(Boolean);
}

/**
 * Opciones para app.connectMicroservice(...) en el main.ts de cada servicio
 * que CONSUME eventos.
 *
 * - groupId: consumer group del servicio (billing-svc, provisioning-svc, ...).
 * - fromBeginning: un grupo nuevo lee desde el inicio del log (replay).
 */
export function buildKafkaConsumerOptions(
  clientId: string,
  groupId: string,
): MicroserviceOptions {
  return {
    transport: Transport.KAFKA,
    options: {
      client: { clientId, brokers: getBrokers() },
      consumer: { groupId, allowAutoTopicCreation: false },
      subscribe: { fromBeginning: true },
    },
  };
}
