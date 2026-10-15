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
}
