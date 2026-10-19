import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

/** Colección `billing_accounts` (sección 07): una cuenta simulada por activación. */
@Schema({ collection: 'billing_accounts', timestamps: true })
export class BillingAccount {
  @Prop({ required: true, unique: true })
  activationId: string;

  @Prop({ required: true })
  customerId: string;

  // Opcionales: un marcador de anulación (el fallo llegó antes que la cuenta) no los tiene todavía.
  @Prop()
  planId?: string;

  @Prop()
  billingAccountId?: string;

  @Prop({ type: String, enum: ['CREATED', 'CANCELLED'], default: 'CREATED' })
  status: 'CREATED' | 'CANCELLED';
}

export const BillingAccountSchema = SchemaFactory.createForClass(BillingAccount);
