import { Module } from '@nestjs/common';
import { BillingServiceController } from './billing-service.controller';
import { BillingServiceService } from './billing-service.service';

@Module({
  imports: [],
  controllers: [BillingServiceController],
  providers: [BillingServiceService],
})
export class BillingServiceModule {}
