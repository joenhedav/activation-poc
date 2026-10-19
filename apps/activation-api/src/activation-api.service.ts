import {
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomUUID } from 'crypto';
import { Model } from 'mongoose';
import { ACTIVATION_STATUS, createEvent } from '@app/contracts';
import { KafkaPublisher } from '@app/kafka-toolkit';
import { ActivationGateway } from './activation.gateway';
import { CreateActivationDto } from './dto/create-activation.dto';
import { Activation } from './schemas/activation.schema';

@Injectable()
export class ActivationApiService {
  private readonly logger = new Logger(ActivationApiService.name);

  constructor(
    @InjectModel(Activation.name) private readonly model: Model<Activation>,
    private readonly publisher: KafkaPublisher,
    private readonly gateway: ActivationGateway,
  ) {}

  async create(dto: CreateActivationDto) {
    const activationId = `act-${randomUUID().slice(0, 8)}`;
    const simulateFailure = dto.simulateFailure ?? 'none';
    const channel = dto.channel ?? 'web';

    const created = await this.model.create({
      _id: activationId,
      customerId: dto.customerId,
      planId: dto.planId,
      status: ACTIVATION_STATUS.PENDING,
      simulateFailure,
      history: [{ eventType: 'ActivationRequested', at: new Date() }],
    });

    // Se avisa a la UI antes de publicar, así la timeline siempre empieza en PENDING.
    this.gateway.emitUpdate(created.toObject());

    // Fases 1-3: se publica directo después de guardar. Si Kafka falla acá, la
    // activación queda PENDING sin evento (riesgo documentado; lo resuelve el outbox en la fase 4).
    try {
      await this.publisher.publish(
        createEvent({
          eventType: 'ActivationRequested',
          correlationId: activationId,
          customerId: dto.customerId,
          source: 'activation-api',
          payload: { planId: dto.planId, channel, simulateFailure },
        }),
      );
    } catch (err) {
      this.logger.error(`No se pudo publicar ActivationRequested de ${activationId}`, err);
      throw new ServiceUnavailableException('No se pudo publicar el evento en Kafka');
    }

    return { activationId, status: ACTIVATION_STATUS.PENDING };
  }

  async findOne(id: string) {
    const activation = await this.model.findById(id).lean();
    if (!activation) {
      throw new NotFoundException(`Activación ${id} no encontrada`);
    }
    return activation;
  }

  findRecent() {
    return this.model.find().sort({ createdAt: -1 }).limit(20).lean();
  }
}
