import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { TOPICS } from '@app/contracts';
import type { DomainEvent } from '@app/contracts';
import { BillingServiceService } from './billing-service.service';

@Controller()
export class BillingServiceController {
  private readonly logger = new Logger(BillingServiceController.name);

  constructor(private readonly service: BillingServiceService) {}

  @EventPattern(TOPICS.ACTIVATION_REQUESTED)
  async onActivationRequested(@Payload() event: DomainEvent) {
    // Mensajes que no son un evento válido (ej. texto suelto): se ignoran por ahora.
    // En la fase 3 irán a la DLQ.
    if (!event || typeof event !== 'object' || event.eventType !== 'ActivationRequested') {
      this.logger.warn(`Mensaje ignorado en ${TOPICS.ACTIVATION_REQUESTED}: ${JSON.stringify(event)}`);
      return;
    }
    await this.service.handleActivationRequested(event);
  }

  /** Compensación: si la activación falló, hay que anular la cuenta. */
  @EventPattern(TOPICS.ACTIVATION_EVENTS)
  async onActivationEvent(@Payload() event: DomainEvent) {
    if (!event || typeof event !== 'object' || !('eventType' in event)) {
      this.logger.warn(`Mensaje ignorado en ${TOPICS.ACTIVATION_EVENTS}: ${JSON.stringify(event)}`);
      return;
    }
    if (event.eventType === 'ActivationFailed') {
      await this.service.handleActivationFailed(event);
    }
    // ActivationCompleted: billing no tiene nada que hacer.
  }
}
