import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LoyaltyServiceController } from './loyalty-service.controller';
import { LoyaltyServiceService } from './loyalty-service.service';
import { LoyaltyAward, LoyaltyAwardSchema } from './schemas/loyalty-award.schema';

// directConnection=true: desde fuera de Docker no se resuelve el host "mongo".
const DEFAULT_MONGO_URI =
  'mongodb://localhost:27017/loyalty?replicaSet=rs0&directConnection=true';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI ?? DEFAULT_MONGO_URI),
    MongooseModule.forFeature([{ name: LoyaltyAward.name, schema: LoyaltyAwardSchema }]),
  ],
  controllers: [LoyaltyServiceController],
  providers: [LoyaltyServiceService],
})
export class LoyaltyServiceModule {}
