import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ACTIVATION_STATUS, createEvent } from '@app/contracts';
import type { ActivationStatus, DomainEvent } from '@app/contracts';
import { KafkaPublisher } from '@app/kafka-toolkit';
import { Activation } from './schemas/activation.schema';

export type StepName = 'billing' | 'provisioning';

// Estados en los que la activación todavía admite resultados.
const OPEN: ActivationStatus[] = [
  ACTIVATION_STATUS.PENDING,
  ACTIVATION_STATUS.IN_PROGRESS,
];

/**
 * Agregador de la saga (sección 06): junta los resultados de billing y provisioning
 * y decide si la activación terminó bien o mal. Todas las transiciones son atómicas
 * en Mongo, así que dos eventos simultáneos no pueden finalizar la activación dos veces.
 */
@Injectable()
export class ActivationAggregatorService {
  private readonly logger = new Logger(ActivationAggregatorService.name);

  constructor(
    @InjectModel(Activation.name) private readonly model: Model<Activation>,
    private readonly publisher: KafkaPublisher,
  ) {}

  async applyResult(
    event: DomainEvent,
    step: StepName,
    ok: boolean,
    reason = '',
  ): Promise<void> {
    const activationId = event.correlationId;
    this.logger.log(`← ${event.eventType} (correlationId=${activationId})`);

    // 1) Registrar el resultado, solo si la activación sigue abierta.
    const updated = await this.model
      .findOneAndUpdate(
        { _id: activationId, status: { $in: OPEN } },
        {
          $set: {
            [`steps.${step}`]: {
              status: ok ? 'OK' : 'FAILED',
              at: new Date(event.occurredAt),
            },
            status: ACTIVATION_STATUS.IN_PROGRESS,
          },
          $push: {
            history: { eventType: event.eventType, at: new Date(event.occurredAt) },
          },
        },
        { new: true },
      )
      .lean();

    if (!updated) {
      // Ya finalizada (o inexistente): el resultado tardío solo se registra en el historial.
      await this.recordHistory(event);
      return;
    }

    // 2) Decidir. Con el primer fallo termina mal; con los dos OK termina bien.
    if (!ok) {
      const done = await this.finalize(activationId, ACTIVATION_STATUS.FAILED, 'ActivationFailed');
      if (done) {
        await this.publisher.publish(
          createEvent({
            eventType: 'ActivationFailed',
            correlationId: activationId,
            customerId: done.customerId,
            source: 'activation-api',
            payload: { reason, failedStep: step },
          }),
        );
      }
      return;
    }

    if (updated.steps?.billing?.status === 'OK' && updated.steps?.provisioning?.status === 'OK') {
      const done = await this.finalize(activationId, ACTIVATION_STATUS.ACTIVE, 'ActivationCompleted');
      if (done) {
        await this.publisher.publish(
          createEvent({
            eventType: 'ActivationCompleted',
            correlationId: activationId,
            customerId: done.customerId,
            source: 'activation-api',
            payload: { planId: done.planId },
          }),
        );
      }
    }
  }

  /** Agrega un evento al historial sin tocar el estado. */
  async recordHistory(event: DomainEvent): Promise<void> {
    const result = await this.model.updateOne(
      { _id: event.correlationId },
      { $push: { history: { eventType: event.eventType, at: new Date(event.occurredAt) } } },
    );
    if (result.matchedCount === 0) {
      this.logger.warn(`${event.eventType} de una activación desconocida (${event.correlationId})`);
    } else {
      this.logger.log(`${event.eventType} registrado en el historial (${event.correlationId})`);
    }
  }

  /** Pasa de IN_PROGRESS a un estado final. Devuelve null si otro evento ya la finalizó. */
  private finalize(
    activationId: string,
    to: ActivationStatus,
    eventType: 'ActivationCompleted' | 'ActivationFailed',
  ) {
    return this.model
      .findOneAndUpdate(
        { _id: activationId, status: ACTIVATION_STATUS.IN_PROGRESS },
        { $set: { status: to }, $push: { history: { eventType, at: new Date() } } },
        { new: true },
      )
      .lean();
  }
}
