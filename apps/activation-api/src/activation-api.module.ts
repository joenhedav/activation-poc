import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { KafkaToolkitModule } from '@app/kafka-toolkit';
import { ActivationApiController } from './activation-api.controller';
import { ActivationApiService } from './activation-api.service';
import { Activation, ActivationSchema } from './schemas/activation.schema';

// Desde tu máquina el replica set se anuncia como "mongo:27017", que no se resuelve
// fuera de Docker: directConnection=true evita el descubrimiento de miembros.
const DEFAULT_MONGO_URI =
  'mongodb://localhost:27017/activation?replicaSet=rs0&directConnection=true';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI ?? DEFAULT_MONGO_URI),
    MongooseModule.forFeature([
      { name: Activation.name, schema: ActivationSchema },
    ]),
    KafkaToolkitModule.forRoot({ clientId: 'activation-api' }),
  ],
  controllers: [ActivationApiController],
  providers: [ActivationApiService],
})
export class ActivationApiModule {}
