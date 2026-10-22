import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { TOPICS } from '@app/contracts';
import type { DomainEvent } from '@app/contracts';
import { LoyaltyServiceService } from './loyalty-service.service';

@Controller()
export class LoyaltyServiceController {
  private readonly logger = new Logger(LoyaltyServiceController.name);

  constructor(private readonly service: LoyaltyServiceService) {}

  @EventPattern(TOPICS.ACTIVATION_EVENTS)
  async onActivationEvent(@Payload() event: DomainEvent) {
    if (!event || typeof event !== 'object' || !('eventType' in event)) {
      this.logger.warn(`Mensaje ignorado en ${TOPICS.ACTIVATION_EVENTS}: ${JSON.stringify(event)}`);
      return;
    }
    if (event.eventType === 'ActivationCompleted') {
      await this.service.award(event);
    }
  }
}
