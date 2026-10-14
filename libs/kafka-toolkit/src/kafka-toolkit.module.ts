import { Module } from '@nestjs/common';
import { KafkaToolkitService } from './kafka-toolkit.service';

@Module({
  providers: [KafkaToolkitService],
  exports: [KafkaToolkitService],
})
export class KafkaToolkitModule {}
