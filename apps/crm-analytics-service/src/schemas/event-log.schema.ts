import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

/** Colección `event_log` (sección 07): copia de cada evento recibido. */
@Schema({ collection: 'event_log', timestamps: true })
export class EventLog {
  @Prop({ required: true, unique: true })
  eventId: string;

  @Prop({ required: true })
  eventType: string;

  @Prop()
  version: number;

  @Prop()
  occurredAt: Date;

  @Prop({ required: true, index: true })
  correlationId: string;

  @Prop()
  customerId: string;

  @Prop()
  source: string;

  @Prop()
  topic: string;

  @Prop({ type: Object })
  payload: Record<string, unknown>;
}

export const EventLogSchema = SchemaFactory.createForClass(EventLog);
