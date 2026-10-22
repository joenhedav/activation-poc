import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { DomainEvent } from '@app/contracts';
import { EventLog } from './schemas/event-log.schema';

@Injectable()
export class CrmAnalyticsServiceService {
  private readonly logger = new Logger(CrmAnalyticsServiceService.name);

  constructor(@InjectModel(EventLog.name) private readonly model: Model<EventLog>) {}

  /** Guarda una copia del evento. El eventId único evita duplicados si se reprocesa. */
  async record(topic: string, event: DomainEvent): Promise<void> {
    // Mensajes que no son un evento válido: se ignoran por ahora (fase 3: DLQ).
    if (!event || typeof event !== 'object' || !('eventId' in event)) {
      this.logger.warn(`Mensaje ignorado en ${topic}: ${JSON.stringify(event)}`);
      return;
    }

    const result = await this.model.updateOne(
      { eventId: event.eventId },
      {
        $setOnInsert: {
          eventType: event.eventType,
          version: event.version,
          occurredAt: new Date(event.occurredAt),
          correlationId: event.correlationId,
          customerId: event.customerId,
          source: event.source,
          topic,
          payload: event.payload,
        },
      },
      { upsert: true },
    );

    if (result.upsertedCount) {
      this.logger.log(`✓ ${event.eventType} registrado (${topic}, correlationId=${event.correlationId})`);
    } else {
      this.logger.warn(`${event.eventType} ya estaba registrado (eventId=${event.eventId}): se omite`);
    }
  }
}
