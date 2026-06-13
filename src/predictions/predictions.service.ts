import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlacePredictionDto } from './dto/place-prediction.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { MarketStatus, AuditAction, PredictionStatus } from '@prisma/client';
import { WebsocketService } from '../websocket/websocket.service';
import { ProbabilityService } from '../markets/probability.service';

@Injectable()
export class PredictionsService {
  constructor(
    private prisma: PrismaService,
    private ws: WebsocketService,
    private probability: ProbabilityService,
  ) {}

  async place(userId: string, dto: PlacePredictionDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Verify market exists and is open
      const market = await tx.market.findUnique({
        where: { id: dto.marketId },
        include: { outcomes: true },
      });

      if (!market) {
        throw new NotFoundException('Market not found');
      }

      if (market.status !== MarketStatus.OPEN) {
        throw new BadRequestException('Market is not open for predictions');
      }

      if (market.endsAt && market.endsAt < new Date()) {
        throw new BadRequestException('Market prediction window has closed');
      }

      // 2. Verify outcome exists in market
      const outcome = market.outcomes.find((o) => o.id === dto.outcomeId);
      if (!outcome) {
        throw new BadRequestException('Outcome does not exist in this market');
      }

      // 3. Check user balance
      const user = await tx.user.findUnique({
        where: { id: userId },
      });

      if (!user || user.balance < dto.stake) {
        throw new BadRequestException('Insufficient balance');
      }

      // 4. Calculate fixed odds reward for FIFA_MATCH
      let fixedReward = null;
      if (market.marketType === 'FIFA_MATCH') {
        const prob = Math.max(0.01, Number(outcome.probability || 0.33));
        fixedReward = Math.floor(dto.stake / prob);
      }

      // 5. Create prediction
      const prediction = await tx.prediction.create({
        data: {
          userId,
          marketId: dto.marketId,
          outcomeId: dto.outcomeId,
          stake: dto.stake,
          reward: fixedReward,
        },
      });

      // 5. Update user balance
      await tx.user.update({
        where: { id: userId },
        data: { balance: { decrement: dto.stake } },
      });

      // 6. Update market pool and outcome pool
      const newTotalPool = market.totalPool + dto.stake;
      const newOutcomePool = outcome.poolTokens + dto.stake;

      await tx.market.update({
        where: { id: dto.marketId },
        data: {
          totalPool: newTotalPool,
          participantCount: { increment: 1 }, // Note: unique participant count requires distinct check, simplified here
        },
      });

      await tx.outcome.update({
        where: { id: dto.outcomeId },
        data: { poolTokens: newOutcomePool },
      });

      // 7. Recalculate probabilities for ALL outcomes
      let newProbabilities: { id: string, probability: number }[] = [];
      
      if (market.marketType !== 'FIFA_MATCH') {
        const updatedOutcomes = market.outcomes.map((o) => ({
          id: o.id,
          poolTokens: o.id === dto.outcomeId ? newOutcomePool : o.poolTokens,
        }));

        newProbabilities = this.probability.recalculateAll(updatedOutcomes, newTotalPool);

        for (const p of newProbabilities) {
          await tx.outcome.update({
            where: { id: p.id },
            data: { probability: p.probability },
          });
        }
      }

      // 8. Audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: AuditAction.PREDICTION_PLACED,
          entity: 'Prediction',
          entityId: prediction.id,
          metadata: { marketId: market.id, stake: dto.stake },
        },
      });

      // 9. Fire WS events
      if (newProbabilities.length > 0) {
        this.ws.emitProbabilityUpdate(market.id, newProbabilities);
      }
      this.ws.emitNewPrediction(market.id, prediction);

      return prediction;
    });
  }

  async getActive(userId: string) {
    return this.prisma.prediction.findMany({
      where: { userId, status: PredictionStatus.ACTIVE },
      orderBy: { createdAt: 'desc' },
      include: {
        market: {
          select: { id: true, title: true, status: true, endsAt: true },
        },
        outcome: {
          select: { id: true, name: true, probability: true },
        },
      },
    });
  }

  async getHistory(userId: string, pagination: PaginationDto) {
    const { skip, take } = pagination;

    const [total, data] = await Promise.all([
      this.prisma.prediction.count({ where: { userId } }),
      this.prisma.prediction.findMany({
        where: { userId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          market: {
            select: { id: true, title: true, status: true, resolvedAt: true },
          },
          outcome: {
            select: { id: true, name: true, isWinner: true },
          },
        },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page: pagination.page || 1,
        limit: take,
        totalPages: Math.ceil(total / take),
        hasNext: skip + take < total,
        hasPrev: skip > 0,
      },
    };
  }

  async findOne(id: string, userId: string) {
    const prediction = await this.prisma.prediction.findUnique({
      where: { id },
      include: {
        market: true,
        outcome: true,
      },
    });

    if (!prediction) {
      throw new NotFoundException('Prediction not found');
    }

    if (prediction.userId !== userId) {
      throw new BadRequestException('Access denied');
    }

    return prediction;
  }
}
