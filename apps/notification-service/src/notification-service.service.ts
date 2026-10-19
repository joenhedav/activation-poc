import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { DomainEvent } from '@app/contracts';
import { MailerService } from './mailer.service';
import { Notification } from './schemas/notification.schema';

type NotifiableEvent = DomainEvent<'ActivationCompleted' | 'ActivationFailed'>;

@Injectable()
export class NotificationServiceService {
  private readonly logger = new Logger(NotificationServiceService.name);

  constructor(
    @InjectModel(Notification.name) private readonly model: Model<Notification>,
    private readonly mailer: MailerService,
  ) {}

  async notify(event: NotifiableEvent): Promise<void> {
    const activationId = event.correlationId;
    const { eventType } = event;
    this.logger.log(`← ${eventType} recibido (correlationId=${activationId})`);

    // Un evento repetido no debe mandar un segundo email.
    const existing = await this.model.findOne({ activationId, eventType }).lean();
    if (existing?.status === 'SENT') {
      this.logger.warn(`Email de ${eventType} para ${activationId} ya enviado: se omite`);
      return;
    }

    const to = `${event.customerId.toLowerCase()}@clientes.demo`;
    const { subject, text } = this.buildEmail(event);

    if (!existing) {
      await this.model.create({
        activationId,
        eventType,
        customerId: event.customerId,
        to,
        subject,
        status: 'PENDING',
      });
    }

    await this.mailer.send(to, subject, text);
    await this.model.updateOne(
      { activationId, eventType },
      { $set: { status: 'SENT', sentAt: new Date() } },
    );
    this.logger.log(`✉ Email enviado a ${to}: "${subject}"`);
  }

  private buildEmail(event: NotifiableEvent): { subject: string; text: string } {
    const id = event.correlationId;

    if (event.eventType === 'ActivationCompleted') {
      return {
        subject: `¡Tu plan ${event.payload.planId} ya está activo!`,
        text:
          `Hola ${event.customerId},\n\n` +
          `Tu plan ${event.payload.planId} se activó correctamente.\n` +
          `Número de activación: ${id}\n\n¡Bienvenido!`,
      };
    }

    return {
      subject: 'No pudimos activar tu plan',
      text:
        `Hola ${event.customerId},\n\n` +
        `Tuvimos un problema al activar tu plan (paso: ${event.payload.failedStep}).\n` +
        `Motivo: ${event.payload.reason}\n` +
        `Número de activación: ${id}\n\n` +
        `No se te cobró nada: cualquier cuenta creada fue anulada.`,
    };
  }
}
