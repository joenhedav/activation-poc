import { Injectable, Logger } from '@nestjs/common';
import { dlqOf } from '@app/contracts';
import type { DomainEvent, Topic } from '@app/contracts';
import { KafkaPublisher } from './kafka-publisher.service';

/** Espera creciente entre reintentos. Son 3 reintentos después del primer intento (RNF-04). */
export const RETRY_DELAYS_MS = [1000, 2000, 4000];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const errorText = (err: unknown): string =>
  err instanceof Error ? `${err.name}: ${err.message}` : String(err);

/** Comprueba que el mensaje tenga la forma del sobre de eventos (sección 05). */
function isDomainEvent(value: unknown): value is DomainEvent {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  const text = ['eventId', 'eventType', 'correlationId', 'customerId', 'source'];
  return (
    text.every((k) => typeof v[k] === 'string' && (v[k] as string).length > 0) &&
    typeof v.version === 'number' &&
    !!v.payload &&
    typeof v.payload === 'object'
  );
}

/**
 * Envuelve el procesamiento de cada mensaje:
 *  - mensaje inválido  → directo a <topic>.dlq
 *  - error al procesar → 3 reintentos (1 s, 2 s, 4 s) y, si sigue fallando, a <topic>.dlq
 * En ambos casos el consumidor sigue con el mensaje siguiente: un mensaje roto no frena la partición.
 */
@Injectable()
export class KafkaConsumerGuard {
  private readonly logger = new Logger(KafkaConsumerGuard.name);

  constructor(private readonly publisher: KafkaPublisher) {}

  async handle(
    topic: Topic,
    service: string,
    message: unknown,
    handler: (event: DomainEvent) => Promise<void>,
  ): Promise<void> {
    if (!isDomainEvent(message)) {
      await this.sendToDlq(topic, service, message, 'Mensaje inválido: no tiene la forma de un evento', 0);
      return;
    }

    let lastError: unknown;
    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
      try {
        await handler(message);
        return;
      } catch (err) {
        lastError = err;
        if (attempt < RETRY_DELAYS_MS.length) {
          const delay = RETRY_DELAYS_MS[attempt];
          this.logger.warn(
            `Falló ${message.eventType} (${message.correlationId}): ${errorText(err)}. Reintento ${attempt + 1}/${RETRY_DELAYS_MS.length} en ${delay} ms`,
          );
          await sleep(delay);
        }
      }
    }

    await this.sendToDlq(topic, service, message, errorText(lastError), RETRY_DELAYS_MS.length + 1);
  }

  private async sendToDlq(
    topic: Topic,
    service: string,
    message: unknown,
    reason: string,
    attempts: number,
  ): Promise<void> {
    const dlqTopic = dlqOf(topic);
    const customerId = (message as { customerId?: unknown } | null)?.customerId;

    await this.publisher.publishRaw(
      dlqTopic,
      message,
      typeof customerId === 'string' ? customerId : undefined,
      {
        'dlq-original-topic': topic,
        'dlq-service': service,
        'dlq-error': reason.slice(0, 500),
        'dlq-attempts': String(attempts),
        'dlq-failed-at': new Date().toISOString(),
      },
    );

    this.logger.error(`✖ Mensaje enviado a ${dlqTopic} (${service}): ${reason}`);
  }
}
