import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MailerService } from './mailer.service';
import { NotificationServiceController } from './notification-service.controller';
import { NotificationServiceService } from './notification-service.service';
import {
  Notification,
  NotificationSchema,
} from './schemas/notification.schema';

// directConnection=true: desde fuera de Docker no se resuelve el host "mongo".
const DEFAULT_MONGO_URI =
  'mongodb://localhost:27017/notification?replicaSet=rs0&directConnection=true';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI ?? DEFAULT_MONGO_URI),
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
    ]),
  ],
  controllers: [NotificationServiceController],
  providers: [NotificationServiceService, MailerService],
})
export class NotificationServiceModule {}
