import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { TOPICS } from '@app/contracts';
import type { DomainEvent } from '@app/contracts';
import { ProvisioningServiceService } from './provisioning-service.service';

@Controller()
export class ProvisioningServiceController {
  private readonly logger = new Logger(ProvisioningServiceController.name);

  constructor(private readonly service: ProvisioningServiceService) {}

  @EventPattern(TOPICS.ACTIVATION_REQUESTED)
  async onActivationRequested(@Payload() event: DomainEvent) {
    // Mensajes que no son un evento válido: se ignoran por ahora (fase 3: DLQ).
    if (!event || typeof event !== 'object' || event.eventType !== 'ActivationRequested') {
      this.logger.warn(`Mensaje ignorado en ${TOPICS.ACTIVATION_REQUESTED}: ${JSON.stringify(event)}`);
      return;
    }
    await this.service.handleActivationRequested(event);
  }
}
