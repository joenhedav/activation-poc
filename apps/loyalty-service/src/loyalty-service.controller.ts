import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { TOPICS } from '@app/contracts';
import { KafkaConsumerGuard } from '@app/kafka-toolkit';
import { LoyaltyServiceService } from './loyalty-service.service';

@Controller()
export class LoyaltyServiceController {
  constructor(
    private readonly service: LoyaltyServiceService,
    private readonly guard: KafkaConsumerGuard,
  ) {}

  @EventPattern(TOPICS.ACTIVATION_EVENTS)
  onActivationEvent(@Payload() message: unknown) {
    return this.guard.handle(TOPICS.ACTIVATION_EVENTS, 'loyalty', message, async (event) => {
      if (event.eventType === 'ActivationCompleted') {
        await this.service.award(event);
      }
    });
  }
}
