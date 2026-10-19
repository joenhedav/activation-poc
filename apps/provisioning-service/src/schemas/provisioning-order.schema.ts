import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

/** Colección `provisioning_orders` (sección 07): una orden simulada por activación. */
@Schema({ collection: 'provisioning_orders', timestamps: true })
export class ProvisioningOrder {
  @Prop({ required: true, unique: true })
  activationId: string;

  @Prop({ required: true })
  customerId: string;

  @Prop({ required: true })
  planId: string;

  @Prop({ required: true })
  orderId: string;

  @Prop({ type: String, enum: ['COMPLETED'], default: 'COMPLETED' })
  status: 'COMPLETED';
}

export const ProvisioningOrderSchema = SchemaFactory.createForClass(ProvisioningOrder);
