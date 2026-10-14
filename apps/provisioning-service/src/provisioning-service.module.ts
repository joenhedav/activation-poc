import { Module } from '@nestjs/common';
import { ProvisioningServiceController } from './provisioning-service.controller';
import { ProvisioningServiceService } from './provisioning-service.service';

@Module({
  imports: [],
  controllers: [ProvisioningServiceController],
  providers: [ProvisioningServiceService],
})
export class ProvisioningServiceModule {}
