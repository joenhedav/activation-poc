import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import {
  EVENT_TOPIC,
  EventEnvelope,
  EventPayloads,
  EventType,
} from '@app/contracts';
import { KAFKA_CLIENT } from './kafka.config';

/**
 * Publica eventos de dominio en el topic que les corresponde.
 * La clave del mensaje es customerId: garantiza orden por cliente (RNF-02).
 */
@Injectable()
export class KafkaPublisher implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaPublisher.name);

  constructor(@Inject(KAFKA_CLIENT) private readonly client: ClientKafka) {}

  async onModuleInit(): Promise<void> {
    await this.client.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.close();
  }

  async publish<T extends EventType>(
    event: EventEnvelope<T, EventPayloads[T]>,
  ): Promise<void> {
    const topic = EVENT_TOPIC[event.eventType];

    await this.publishRaw(topic, event, event.customerId, {
      eventType: event.eventType,
      correlationId: event.correlationId,
    });

    this.logger.log(
      `→ ${event.eventType} publicado en ${topic} (correlationId=${event.correlationId})`,
    );
  }

  /** Publica un mensaje tal cual en un topic (lo usa la DLQ para reenviar el original). */
  async publishRaw(
    topic: string,
    value: unknown,
    key: string | undefined,
    headers: Record<string, string>,
  ): Promise<void> {
    await lastValueFrom(this.client.emit(topic, { key, value, headers }));
  }
}
