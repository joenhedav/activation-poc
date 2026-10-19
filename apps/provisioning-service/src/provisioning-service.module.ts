import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { KafkaToolkitModule } from '@app/kafka-toolkit';
import { ProvisioningServiceController } from './provisioning-service.controller';
import { ProvisioningServiceService } from './provisioning-service.service';
import {
  ProvisioningOrder,
  ProvisioningOrderSchema,
} from './schemas/provisioning-order.schema';

// directConnection=true: desde fuera de Docker no se resuelve el host "mongo".
const DEFAULT_MONGO_URI =
  'mongodb://localhost:27017/provisioning?replicaSet=rs0&directConnection=true';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI ?? DEFAULT_MONGO_URI),
    MongooseModule.forFeature([
      { name: ProvisioningOrder.name, schema: ProvisioningOrderSchema },
    ]),
    KafkaToolkitModule.forRoot({ clientId: 'provisioning-service' }),
  ],
  controllers: [ProvisioningServiceController],
  providers: [ProvisioningServiceService],
})
export class ProvisioningServiceModule {}
