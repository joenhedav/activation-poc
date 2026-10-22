import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { TOPICS } from '@app/contracts';
import type { Topic } from '@app/contracts';
import { KafkaConsumerGuard } from '@app/kafka-toolkit';
import { CrmAnalyticsServiceService } from './crm-analytics-service.service';

/** Escucha los 4 topics de negocio: demuestra que se suma un consumidor sin tocar a los demás. */
@Controller()
export class CrmAnalyticsServiceController {
  constructor(
    private readonly service: CrmAnalyticsServiceService,
    private readonly guard: KafkaConsumerGuard,
  ) {}

  private record(topic: Topic, message: unknown) {
    return this.guard.handle(topic, 'crm-analytics', message, (event) =>
      this.service.record(topic, event),
    );
  }

  @EventPattern(TOPICS.ACTIVATION_REQUESTED)
  onActivationRequested(@Payload() message: unknown) {
    return this.record(TOPICS.ACTIVATION_REQUESTED, message);
  }

  @EventPattern(TOPICS.BILLING_EVENTS)
  onBillingEvent(@Payload() message: unknown) {
    return this.record(TOPICS.BILLING_EVENTS, message);
  }

  @EventPattern(TOPICS.PROVISIONING_EVENTS)
  onProvisioningEvent(@Payload() message: unknown) {
    return this.record(TOPICS.PROVISIONING_EVENTS, message);
  }

  @EventPattern(TOPICS.ACTIVATION_EVENTS)
  onActivationEvent(@Payload() message: unknown) {
    return this.record(TOPICS.ACTIVATION_EVENTS, message);
  }
}
