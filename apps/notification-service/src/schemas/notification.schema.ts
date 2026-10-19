import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

/** Colección `notifications` (sección 07): un email por activación y tipo de evento. */
@Schema({ collection: 'notifications', timestamps: true })
export class Notification {
  @Prop({ required: true })
  activationId: string;

  @Prop({ required: true })
  eventType: string;

  @Prop({ required: true })
  customerId: string;

  @Prop({ required: true })
  to: string;

  @Prop({ required: true })
  subject: string;

  @Prop({ type: String, enum: ['PENDING', 'SENT'], default: 'PENDING' })
  status: 'PENDING' | 'SENT';

  @Prop()
  sentAt?: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
// Garantiza un solo email por activación y tipo de evento.
NotificationSchema.index({ activationId: 1, eventType: 1 }, { unique: true });
