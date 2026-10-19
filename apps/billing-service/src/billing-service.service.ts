import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomUUID } from 'crypto';
import { Model } from 'mongoose';
import { DomainEvent, createEvent } from '@app/contracts';
import { KafkaPublisher } from '@app/kafka-toolkit';
import { BillingAccount } from './schemas/billing-account.schema';

@Injectable()
export class BillingServiceService {
  private readonly logger = new Logger(BillingServiceService.name);

  constructor(
    @InjectModel(BillingAccount.name) private readonly model: Model<BillingAccount>,
    private readonly publisher: KafkaPublisher,
  ) {}

  async handleActivationRequested(event: DomainEvent<'ActivationRequested'>) {
    const activationId = event.correlationId;
    this.logger.log(`← ActivationRequested recibido (correlationId=${activationId})`);

    // Fallo de negocio simulado: no es un error técnico, se publica como evento.
    if (event.payload.simulateFailure === 'billing') {
      await this.publisher.publish(
        createEvent({
          eventType: 'BillingFailed',
          correlationId: activationId,
          customerId: event.customerId,
          source: 'billing',
          payload: { reason: 'Fallo simulado en billing' },
        }),
      );
      return;
    }

    // Reentrega (al menos una vez): si la cuenta ya existe, se reutiliza en lugar de
    // fallar por clave duplicada. La idempotencia por eventId llega en la fase 3.
    const existing = await this.model.findOne({ activationId }).lean();
    let billingAccountId: string;
    if (existing) {
      billingAccountId = existing.billingAccountId;
      this.logger.warn(
        `Cuenta ya existente para ${activationId}: se reutiliza ${billingAccountId} (mensaje reentregado)`,
      );
    } else {
      billingAccountId = `bill-${randomUUID().slice(0, 8)}`;
      await this.model.create({
        activationId,
        customerId: event.customerId,
        planId: event.payload.planId,
        billingAccountId,
        status: 'CREATED',
      });
    }

    await this.publisher.publish(
      createEvent({
        eventType: 'BillingAccountCreated',
        correlationId: activationId,
        customerId: event.customerId,
        source: 'billing',
        payload: { billingAccountId },
      }),
    );
  }
}
