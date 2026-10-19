import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { TOPICS } from '@app/contracts';
import type { DomainEvent } from '@app/contracts';
import { ActivationAggregatorService } from './activation-aggregator.service';

/** Consumidor Kafka de activation-api: recibe los resultados de billing y provisioning. */
@Controller()
export class ActivationEventsController {
  private readonly logger = new Logger(ActivationEventsController.name);

  constructor(private readonly aggregator: ActivationAggregatorService) {}

  @EventPattern(TOPICS.BILLING_EVENTS)
  async onBillingEvent(@Payload() event: DomainEvent) {
    if (!this.isEvent(event, TOPICS.BILLING_EVENTS)) return;

    switch (event.eventType) {
      case 'BillingAccountCreated':
        return this.aggregator.applyResult(event, 'billing', true);
      case 'BillingFailed':
        return this.aggregator.applyResult(event, 'billing', false, event.payload.reason);
      case 'BillingAccountCancelled':
        // Compensación ya hecha por billing: solo queda en el historial.
        return this.aggregator.recordHistory(event);
    }
  }

  @EventPattern(TOPICS.PROVISIONING_EVENTS)
  async onProvisioningEvent(@Payload() event: DomainEvent) {
    if (!this.isEvent(event, TOPICS.PROVISIONING_EVENTS)) return;

    switch (event.eventType) {
      case 'ProvisioningCompleted':
        return this.aggregator.applyResult(event, 'provisioning', true);
      case 'ProvisioningFailed':
        return this.aggregator.applyResult(event, 'provisioning', false, event.payload.reason);
    }
  }

  // Mensajes que no son un evento válido: se ignoran por ahora (fase 3: DLQ).
  private isEvent(event: unknown, topic: string): event is DomainEvent {
    const ok = !!event && typeof event === 'object' && 'eventType' in event;
    if (!ok) {
      this.logger.warn(`Mensaje ignorado en ${topic}: ${JSON.stringify(event)}`);
    }
    return ok;
  }
}
