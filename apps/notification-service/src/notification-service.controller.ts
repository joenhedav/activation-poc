import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { TOPICS } from '@app/contracts';
import { KafkaConsumerGuard } from '@app/kafka-toolkit';
import { NotificationServiceService } from './notification-service.service';

@Controller()
export class NotificationServiceController {
  constructor(
    private readonly service: NotificationServiceService,
    private readonly guard: KafkaConsumerGuard,
  ) {}

  @EventPattern(TOPICS.ACTIVATION_EVENTS)
  onActivationEvent(@Payload() message: unknown) {
    return this.guard.handle(TOPICS.ACTIVATION_EVENTS, 'notification', message, async (event) => {
      if (event.eventType === 'ActivationCompleted' || event.eventType === 'ActivationFailed') {
        await this.service.notify(event);
      }
    });
  }
}
