import { Controller, Get } from '@nestjs/common';
import { ActivationApiService } from './activation-api.service';

@Controller()
export class ActivationApiController {
  constructor(private readonly activationApiService: ActivationApiService) {}

  @Get()
  getHello(): string {
    return this.activationApiService.getHello();
  }
}
