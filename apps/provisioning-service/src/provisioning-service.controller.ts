import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { TOPICS } from '@app/contracts';
import { KafkaConsumerGuard } from '@app/kafka-toolkit';
import { ProvisioningServiceService } from './provisioning-service.service';

@Controller()
export class ProvisioningServiceController {
  constructor(
    private readonly service: ProvisioningServiceService,
    private readonly guard: KafkaConsumerGuard,
  ) {}

  @EventPattern(TOPICS.ACTIVATION_REQUESTED)
  onActivationRequested(@Payload() message: unknown) {
    return this.guard.handle(TOPICS.ACTIVATION_REQUESTED, 'provisioning', message, async (event) => {
      if (event.eventType === 'ActivationRequested') {
        await this.service.handleActivationRequested(event);
      }
    });
  }
}
