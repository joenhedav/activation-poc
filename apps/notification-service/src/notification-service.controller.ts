import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { TOPICS } from '@app/contracts';
import type { DomainEvent } from '@app/contracts';
import { NotificationServiceService } from './notification-service.service';

@Controller()
export class NotificationServiceController {
  private readonly logger = new Logger(NotificationServiceController.name);

  constructor(private readonly service: NotificationServiceService) {}

  @EventPattern(TOPICS.ACTIVATION_EVENTS)
  async onActivationEvent(@Payload() event: DomainEvent) {
    // Mensajes que no son un evento válido: se ignoran por ahora (fase 3: DLQ).
    if (!event || typeof event !== 'object' || !('eventType' in event)) {
      this.logger.warn(`Mensaje ignorado en ${TOPICS.ACTIVATION_EVENTS}: ${JSON.stringify(event)}`);
      return;
    }
    if (event.eventType === 'ActivationCompleted' || event.eventType === 'ActivationFailed') {
      await this.service.notify(event);
    }
  }
}
