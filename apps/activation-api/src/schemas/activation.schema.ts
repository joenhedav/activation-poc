import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ACTIVATION_STATUS } from '@app/contracts';
import type { ActivationStatus, SimulateFailure } from '@app/contracts';

export interface StepResult {
  status: 'OK' | 'FAILED';
  at: Date;
}

/** Colección `activations` (sección 07). _id = activationId. */
@Schema({ collection: 'activations', timestamps: true, minimize: false })
export class Activation {
  @Prop({ type: String })
  _id: string;

  @Prop({ required: true, index: true })
  customerId: string;

  @Prop({ required: true })
  planId: string;

  @Prop({
    type: String,
    enum: Object.values(ACTIVATION_STATUS),
    default: ACTIVATION_STATUS.PENDING,
  })
  status: ActivationStatus;

  @Prop({ type: String, default: 'none' })
  simulateFailure: SimulateFailure;

  /** Resultado parcial de cada servicio (lo completa el agregador). */
  @Prop({ type: Object, default: {} })
  steps: { billing?: StepResult; provisioning?: StepResult };

  @Prop({
    type: [{ eventType: String, at: Date, _id: false }],
    default: [],
  })
  history: { eventType: string; at: Date }[];
}

export const ActivationSchema = SchemaFactory.createForClass(Activation);
