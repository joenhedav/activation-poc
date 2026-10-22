import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { TOPICS } from '@app/contracts';
import { KafkaConsumerGuard } from '@app/kafka-toolkit';
import { BillingServiceService } from './billing-service.service';

@Controller()
export class BillingServiceController {
  constructor(
    private readonly service: BillingServiceService,
    private readonly guard: KafkaConsumerGuard,
  ) {}

  @EventPattern(TOPICS.ACTIVATION_REQUESTED)
  onActivationRequested(@Payload() message: unknown) {
    return this.guard.handle(TOPICS.ACTIVATION_REQUESTED, 'billing', message, async (event) => {
      if (event.eventType === 'ActivationRequested') {
        await this.service.handleActivationRequested(event);
      }
    });
  }

  /** Compensación: si la activación falló, hay que anular la cuenta. */
  @EventPattern(TOPICS.ACTIVATION_EVENTS)
  onActivationEvent(@Payload() message: unknown) {
    return this.guard.handle(TOPICS.ACTIVATION_EVENTS, 'billing', message, async (event) => {
      if (event.eventType === 'ActivationFailed') {
        await this.service.handleActivationFailed(event);
      }
      // ActivationCompleted: billing no tiene nada que hacer.
    });
  }
}
