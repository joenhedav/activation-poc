import { Controller, Get } from '@nestjs/common';
import { ProvisioningServiceService } from './provisioning-service.service';

@Controller()
export class ProvisioningServiceController {
  constructor(private readonly provisioningServiceService: ProvisioningServiceService) {}

  @Get()
  getHello(): string {
    return this.provisioningServiceService.getHello();
  }
}
