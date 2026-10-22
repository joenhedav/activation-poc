import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CrmAnalyticsServiceController } from './crm-analytics-service.controller';
import { CrmAnalyticsServiceService } from './crm-analytics-service.service';
import { EventLog, EventLogSchema } from './schemas/event-log.schema';

// directConnection=true: desde fuera de Docker no se resuelve el host "mongo".
const DEFAULT_MONGO_URI =
  'mongodb://localhost:27017/crm?replicaSet=rs0&directConnection=true';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI ?? DEFAULT_MONGO_URI),
    MongooseModule.forFeature([{ name: EventLog.name, schema: EventLogSchema }]),
  ],
  controllers: [CrmAnalyticsServiceController],
  providers: [CrmAnalyticsServiceService],
})
export class CrmAnalyticsServiceModule {}
