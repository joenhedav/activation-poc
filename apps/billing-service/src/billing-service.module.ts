import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { KafkaToolkitModule } from '@app/kafka-toolkit';
import { BillingServiceController } from './billing-service.controller';
import { BillingServiceService } from './billing-service.service';
import {
  BillingAccount,
  BillingAccountSchema,
} from './schemas/billing-account.schema';

// directConnection=true: desde fuera de Docker no se resuelve el host "mongo".
const DEFAULT_MONGO_URI =
  'mongodb://localhost:27017/billing?replicaSet=rs0&directConnection=true';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI ?? DEFAULT_MONGO_URI),
    MongooseModule.forFeature([
      { name: BillingAccount.name, schema: BillingAccountSchema },
    ]),
    KafkaToolkitModule.forRoot({ clientId: 'billing-service' }),
  ],
  controllers: [BillingServiceController],
  providers: [BillingServiceService],
})
export class BillingServiceModule {}
