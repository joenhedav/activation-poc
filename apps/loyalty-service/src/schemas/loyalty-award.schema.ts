import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

/** Colección `loyalty_awards`: puntos otorgados, uno por activación completada. */
@Schema({ collection: 'loyalty_awards', timestamps: true })
export class LoyaltyAward {
  @Prop({ required: true, unique: true })
  activationId: string;

  @Prop({ required: true, index: true })
  customerId: string;

  @Prop({ required: true })
  planId: string;

  @Prop({ required: true })
  points: number;

  @Prop()
  awardedAt: Date;
}

export const LoyaltyAwardSchema = SchemaFactory.createForClass(LoyaltyAward);
