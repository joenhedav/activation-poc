import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { TOPICS } from '@app/contracts';
import { KafkaConsumerGuard } from '@app/kafka-toolkit';
import { ActivationAggregatorService } from './activation-aggregator.service';

/** Consumidor Kafka de activation-api: recibe los resultados de billing y provisioning. */
@Controller()
export class ActivationEventsController {
  constructor(
    private readonly aggregator: ActivationAggregatorService,
    private readonly guard: KafkaConsumerGuard,
  ) {}

  @EventPattern(TOPICS.BILLING_EVENTS)
  onBillingEvent(@Payload() message: unknown) {
    return this.guard.handle(TOPICS.BILLING_EVENTS, 'activation-api', message, async (event) => {
      switch (event.eventType) {
        case 'BillingAccountCreated':
          await this.aggregator.applyResult(event, 'billing', true);
          break;
        case 'BillingFailed':
          await this.aggregator.applyResult(event, 'billing', false, event.payload.reason);
          break;
        case 'BillingAccountCancelled':
          // Compensación ya hecha por billing: solo queda en el historial.
          await this.aggregator.recordHistory(event);
          break;
      }
    });
  }

  @EventPattern(TOPICS.PROVISIONING_EVENTS)
  onProvisioningEvent(@Payload() message: unknown) {
    return this.guard.handle(TOPICS.PROVISIONING_EVENTS, 'activation-api', message, async (event) => {
      switch (event.eventType) {
        case 'ProvisioningCompleted':
          await this.aggregator.applyResult(event, 'provisioning', true);
          break;
        case 'ProvisioningFailed':
          await this.aggregator.applyResult(event, 'provisioning', false, event.payload.reason);
          break;
      }
    });
  }
}
