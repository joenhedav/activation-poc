import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomUUID } from 'crypto';
import { Model } from 'mongoose';
import { DomainEvent, createEvent } from '@app/contracts';
import { KafkaPublisher } from '@app/kafka-toolkit';
import { ProvisioningOrder } from './schemas/provisioning-order.schema';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

@Injectable()
export class ProvisioningServiceService {
  private readonly logger = new Logger(ProvisioningServiceService.name);

  constructor(
    @InjectModel(ProvisioningOrder.name)
    private readonly model: Model<ProvisioningOrder>,
    private readonly publisher: KafkaPublisher,
  ) {}

  async handleActivationRequested(event: DomainEvent<'ActivationRequested'>) {
    const activationId = event.correlationId;
    this.logger.log(`← ActivationRequested recibido (correlationId=${activationId})`);

    // Simula el aprovisionamiento de la línea: entre 1 y 3 segundos.
    const delayMs = 1000 + Math.floor(Math.random() * 2000);
    await sleep(delayMs);

    // Fallo de negocio simulado: no es un error técnico, se publica como evento.
    if (event.payload.simulateFailure === 'provisioning') {
      await this.publisher.publish(
        createEvent({
          eventType: 'ProvisioningFailed',
          correlationId: activationId,
          customerId: event.customerId,
          source: 'provisioning',
          payload: { reason: 'Fallo simulado en provisioning' },
        }),
      );
      return;
    }

    // Reentrega (al menos una vez): si la orden ya existe, se reutiliza en lugar de
    // fallar por clave duplicada. La idempotencia por eventId llega en la fase 3.
    const existing = await this.model.findOne({ activationId }).lean();
    let orderId: string;
    if (existing) {
      orderId = existing.orderId;
      this.logger.warn(
        `Orden ya existente para ${activationId}: se reutiliza ${orderId} (mensaje reentregado)`,
      );
    } else {
      orderId = `prov-${randomUUID().slice(0, 8)}`;
      await this.model.create({
        activationId,
        customerId: event.customerId,
        planId: event.payload.planId,
        orderId,
        status: 'COMPLETED',
      });
    }

    await this.publisher.publish(
      createEvent({
        eventType: 'ProvisioningCompleted',
        correlationId: activationId,
        customerId: event.customerId,
        source: 'provisioning',
        payload: { orderId },
      }),
    );
  }
}
