import { Module } from '@nestjs/common';
import { ActivationApiController } from './activation-api.controller';
import { ActivationApiService } from './activation-api.service';

@Module({
  imports: [],
  controllers: [ActivationApiController],
  providers: [ActivationApiService],
})
export class ActivationApiModule {}
