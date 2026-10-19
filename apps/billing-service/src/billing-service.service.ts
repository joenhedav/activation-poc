import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomUUID } from 'crypto';
import { Model } from 'mongoose';
import { DomainEvent, createEvent } from '@app/contracts';
import { KafkaPublisher } from '@app/kafka-toolkit';
import { BillingAccount } from './schemas/billing-account.schema';

const newBillingAccountId = () => `bill-${randomUUID().slice(0, 8)}`;

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

    const existing = await this.model.findOne({ activationId }).lean();

    // Caso borde (sección 06): billing ya vio ActivationFailed antes de crear la cuenta.
    // La cuenta se crea igual, pero queda anulada.
    if (existing?.status === 'CANCELLED') {
      const billingAccountId = existing.billingAccountId ?? newBillingAccountId();
      if (!existing.billingAccountId) {
        await this.model.updateOne(
          { activationId },
          { $set: { billingAccountId, planId: event.payload.planId } },
        );
      }
      this.logger.warn(
        `La activación ${activationId} ya había fallado: la cuenta ${billingAccountId} queda anulada`,
      );
      await this.publishCancelled(activationId, event.customerId, billingAccountId, 'La activación ya había fallado');
      return;
    }

    // Reentrega (al menos una vez): si la cuenta ya existe, se reutiliza.
    // La idempotencia por eventId llega en la fase 3.
    let billingAccountId: string;
    if (existing) {
      billingAccountId = existing.billingAccountId as string;
      this.logger.warn(
        `Cuenta ya existente para ${activationId}: se reutiliza ${billingAccountId} (mensaje reentregado)`,
      );
    } else {
      billingAccountId = newBillingAccountId();
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

  /** Compensación: anula la cuenta cuando la activación falló. */
  async handleActivationFailed(event: DomainEvent<'ActivationFailed'>) {
    const activationId = event.correlationId;
    this.logger.log(`← ActivationFailed recibido (correlationId=${activationId})`);

    // Si falló billing no hay cuenta que anular.
    if (event.payload.failedStep === 'billing') {
      this.logger.log(`Billing fue el que falló en ${activationId}: no hay cuenta para anular`);
      return;
    }

    const cancelled = await this.model
      .findOneAndUpdate(
        { activationId, status: 'CREATED' },
        { $set: { status: 'CANCELLED' } },
        { returnDocument: 'after' },
      )
      .lean();

    if (cancelled) {
      await this.publishCancelled(
        activationId,
        event.customerId,
        cancelled.billingAccountId as string,
        event.payload.reason,
      );
      return;
    }

    // No hay cuenta CREATED: o ya estaba anulada (reentrega) o todavía no se creó.
    // Se deja un marcador para que, si se crea después, quede anulada.
    await this.model.updateOne(
      { activationId },
      { $setOnInsert: { customerId: event.customerId, status: 'CANCELLED' } },
      { upsert: true },
    );
    this.logger.warn(`ActivationFailed antes de crear la cuenta de ${activationId}: se deja marcador de anulación`);
  }

  private async publishCancelled(
    activationId: string,
    customerId: string,
    billingAccountId: string,
    reason: string,
  ) {
    await this.publisher.publish(
      createEvent({
        eventType: 'BillingAccountCancelled',
        correlationId: activationId,
        customerId,
        source: 'billing',
        payload: { billingAccountId, reason },
      }),
    );
  }
}
