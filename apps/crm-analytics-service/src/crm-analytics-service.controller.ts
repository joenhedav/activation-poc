import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { TOPICS } from '@app/contracts';
import type { DomainEvent } from '@app/contracts';
import { CrmAnalyticsServiceService } from './crm-analytics-service.service';

/** Escucha los 4 topics de negocio: demuestra que se suma un consumidor sin tocar a los demás. */
@Controller()
export class CrmAnalyticsServiceController {
  constructor(private readonly service: CrmAnalyticsServiceService) {}

  @EventPattern(TOPICS.ACTIVATION_REQUESTED)
  onActivationRequested(@Payload() event: DomainEvent) {
    return this.service.record(TOPICS.ACTIVATION_REQUESTED, event);
  }

  @EventPattern(TOPICS.BILLING_EVENTS)
  onBillingEvent(@Payload() event: DomainEvent) {
    return this.service.record(TOPICS.BILLING_EVENTS, event);
  }

  @EventPattern(TOPICS.PROVISIONING_EVENTS)
  onProvisioningEvent(@Payload() event: DomainEvent) {
    return this.service.record(TOPICS.PROVISIONING_EVENTS, event);
  }

  @EventPattern(TOPICS.ACTIVATION_EVENTS)
  onActivationEvent(@Payload() event: DomainEvent) {
    return this.service.record(TOPICS.ACTIVATION_EVENTS, event);
  }
}
