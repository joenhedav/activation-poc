import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { DomainEvent } from '@app/contracts';
import { LoyaltyAward } from './schemas/loyalty-award.schema';

const POINTS_PER_ACTIVATION = 100;

@Injectable()
export class LoyaltyServiceService {
  private readonly logger = new Logger(LoyaltyServiceService.name);

  constructor(@InjectModel(LoyaltyAward.name) private readonly model: Model<LoyaltyAward>) {}

  /** Suma puntos por una activación completada. Una activación nunca suma dos veces. */
  async award(event: DomainEvent<'ActivationCompleted'>): Promise<void> {
    const activationId = event.correlationId;

    const result = await this.model.updateOne(
      { activationId },
      {
        $setOnInsert: {
          customerId: event.customerId,
          planId: event.payload.planId,
          points: POINTS_PER_ACTIVATION,
          awardedAt: new Date(),
        },
      },
      { upsert: true },
    );

    if (!result.upsertedCount) {
      this.logger.warn(`Los puntos de ${activationId} ya estaban otorgados: se omite`);
      return;
    }

    const [{ total }] = await this.model.aggregate<{ total: number }>([
      { $match: { customerId: event.customerId } },
      { $group: { _id: null, total: { $sum: '$points' } } },
    ]);
    this.logger.log(
      `⭐ ${event.customerId} suma ${POINTS_PER_ACTIVATION} puntos por ${event.payload.planId} (${activationId}). Total: ${total}`,
    );
  }
}
