import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { PayoutService } from './payout.service';
import { WebsocketService } from '../websocket/websocket.service';
import { CreateMarketDto } from './dto/create-market.dto';
import { UpdateMarketDto } from './dto/update-market.dto';
import { MarketFilterDto } from './dto/market-filter.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { MarketStatus, MarketType, AuditAction, PredictionStatus } from '@prisma/client';
import { TOKEN_ECONOMY } from '../common/constants/token-economy';

@Injectable()
export class MarketsService {
  private readonly logger = new Logger(MarketsService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private payout: PayoutService,
    private wsService: WebsocketService,
  ) {}

  async findAll(filter: MarketFilterDto, pagination: PaginationDto) {
    const { skip, take } = pagination;
    const where: any = {};

    if (filter.status) where.status = filter.status;
    if (filter.type) where.marketType = filter.type;
    if (filter.category) where.category = filter.category;
    if (filter.featured !== undefined) where.featured = filter.featured;
    
    if (filter.search) {
      where.OR = [
        { title: { contains: filter.search, mode: 'insensitive' } },
        { description: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = {};
    orderBy[filter.sortBy || 'createdAt'] = filter.sortOrder || 'desc';

    const [total, data] = await Promise.all([
      this.prisma.market.count({ where }),
      this.prisma.market.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          outcomes: {
            orderBy: { sortOrder: 'asc' },
          },
          creator: {
            select: { id: true, username: true },
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

  async getTrending() {
    // Top open markets by totalPool (showing all scheduled matches)
    return this.prisma.market.findMany({
      where: { status: MarketStatus.OPEN },
      orderBy: { totalPool: 'desc' },
      include: { outcomes: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  async getFeatured() {
    return this.prisma.market.findMany({
      where: { featured: true, status: MarketStatus.OPEN },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { outcomes: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  async getLiveMatches() {
    return this.prisma.market.findMany({
      where: { 
        marketType: MarketType.FIFA_MATCH,
        status: MarketStatus.OPEN,
        matchStatus: { in: ['1H', '2H', 'HT', 'ET', 'P'] } // Live statuses
      },
      orderBy: { startsAt: 'desc' },
      take: 20,
      include: { outcomes: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  async getUpcoming() {
    return this.prisma.market.findMany({
      where: { 
        marketType: MarketType.FIFA_MATCH,
        status: MarketStatus.OPEN,
        startsAt: { gt: new Date() }
      },
      orderBy: { startsAt: 'asc' },
      take: 20,
      include: { outcomes: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  async getResolved() {
    const markets = await this.prisma.market.findMany({
      where: {
        marketType: MarketType.FIFA_MATCH,
        status: MarketStatus.RESOLVED,
      },
      orderBy: { resolvedAt: 'desc' },
      take: 20,
      include: {
        outcomes: { orderBy: { sortOrder: 'asc' } },
        predictions: {
          select: {
            id: true,
            stake: true,
            reward: true,
            status: true,
            outcome: { select: { id: true, name: true } },
          },
        },
      },
    });

    // Enrich each market with summary stats
    return markets.map((market) => {
      const winningOutcome = market.outcomes.find((o) => o.isWinner);
      const totalBets = market.predictions.length;
      const totalWinners = market.predictions.filter((p) => p.status === 'WON').length;
      const totalLosers = market.predictions.filter((p) => p.status === 'LOST').length;
      const totalStaked = market.predictions.reduce((sum, p) => sum + p.stake, 0);
      const totalPaidOut = market.predictions.reduce((sum, p) => sum + (p.reward || 0), 0);

      const { predictions, ...marketData } = market;
      return {
        ...marketData,
        winningOutcomeName: winningOutcome?.name || null,
        stats: {
          totalBets,
          totalWinners,
          totalLosers,
          totalStaked,
          totalPaidOut,
        },
      };
    });
  }

  async getCommunity(pagination: PaginationDto) {
    return this.findAll({ type: MarketType.COMMUNITY }, pagination);
  }

  async findOne(id: string) {
    const market = await this.prisma.market.findUnique({
      where: { id },
      include: {
        outcomes: {
          orderBy: { sortOrder: 'asc' },
        },
        creator: {
          select: { id: true, username: true },
        },
      },
    });

    if (!market) {
      throw new NotFoundException('Market not found');
    }

    return market;
  }

  async create(userId: string, dto: CreateMarketDto) {
    return this.prisma.$transaction(async (tx) => {
      const status = dto.category === 'CUSTOM' ? MarketStatus.OPEN : MarketStatus.PENDING_APPROVAL;

      const market = await tx.market.create({
        data: {
          title: dto.title,
          description: dto.description,
          category: dto.category,
          marketType: MarketType.COMMUNITY,
          status: status,
          creatorId: userId,
          resolutionSource: dto.resolutionSource,
          endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
          startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
          outcomes: {
            create: dto.outcomes.map((o, index) => ({
              name: o.name,
              sortOrder: index,
              probability: dto.category === 'CUSTOM' ? 1 / dto.outcomes.length : 0,
            })),
          },
        },
        include: {
          outcomes: true,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: { marketsCreated: { increment: 1 } },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: AuditAction.MARKET_CREATED,
          entity: 'Market',
          entityId: market.id,
        },
      });

      return market;
    });
  }

  async update(userId: string, id: string, dto: UpdateMarketDto) {
    const market = await this.findOne(id);

    if (market.creatorId !== userId) {
      throw new ForbiddenException('You can only update your own markets');
    }

    if (market.status !== MarketStatus.DRAFT && market.status !== MarketStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Can only update markets in DRAFT or PENDING_APPROVAL status');
    }

    // Prepare data
    const data: any = {};
    if (dto.title) data.title = dto.title;
    if (dto.description) data.description = dto.description;
    if (dto.category) data.category = dto.category;
    if (dto.resolutionSource !== undefined) data.resolutionSource = dto.resolutionSource;
    if (dto.bannerUrl !== undefined) data.bannerUrl = dto.bannerUrl;
    if (dto.endsAt) data.endsAt = new Date(dto.endsAt);
    if (dto.startsAt !== undefined) data.startsAt = dto.startsAt ? new Date(dto.startsAt) : null;

    return this.prisma.market.update({
      where: { id },
      data,
      include: { outcomes: true },
    });
  }

  async remove(userId: string, id: string) {
    const market = await this.findOne(id);

    if (market.creatorId !== userId) {
      throw new ForbiddenException('You can only delete your own markets');
    }

    if (market.status !== MarketStatus.DRAFT && market.status !== MarketStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Can only delete markets in DRAFT or PENDING_APPROVAL status');
    }

    await this.prisma.market.delete({
      where: { id },
    });

    return { success: true };
  }

  async getMarketPredictions(marketId: string, pagination: PaginationDto) {
    const { skip, take } = pagination;

    const [total, data] = await Promise.all([
      this.prisma.prediction.count({ where: { marketId } }),
      this.prisma.prediction.findMany({
        where: { marketId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, username: true } },
          outcome: { select: { id: true, name: true } },
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

  async resolveMarket(id: string, winningOutcomeId: string) {
    return this.prisma.$transaction(async (tx) => {
      const market = await tx.market.findUnique({ where: { id }, include: { outcomes: true, predictions: true } });
      if (!market || (market.status !== MarketStatus.LOCKED && market.status !== MarketStatus.OPEN)) {
        throw new BadRequestException('Cannot resolve this market');
      }

      const winningOutcome = market.outcomes.find(o => o.id === winningOutcomeId);
      if (!winningOutcome) throw new BadRequestException('Outcome not found');

      // 1. Mark market resolved
      await tx.market.update({
        where: { id },
        data: { status: MarketStatus.RESOLVED, resolvedAt: new Date(), winningOutcomeId }
      });

      // 2. Mark outcomes
      await tx.outcome.updateMany({ where: { marketId: id }, data: { isWinner: false } });
      await tx.outcome.update({ where: { id: winningOutcomeId }, data: { isWinner: true } });

      // 3. Process payouts
      const winningPool = winningOutcome.poolTokens;
      const totalPool = market.totalPool;

      const userUpdates = new Map<string, { balanceIncrement: number, wins: number, losses: number }>();
      const winningPredictionUpdates = [];

      for (const pred of market.predictions) {
        let userStats = userUpdates.get(pred.userId);
        if (!userStats) {
          userStats = { balanceIncrement: 0, wins: 0, losses: 0 };
          userUpdates.set(pred.userId, userStats);
        }

        if (pred.outcomeId === winningOutcomeId) {
          const reward = market.marketType === 'FIFA_MATCH' 
            ? (pred.reward || Math.floor(pred.stake * 2)) // Fallback if reward is missing for some reason
            : this.payout.calculateReward(pred.stake, winningPool, totalPool);
            
          userStats.balanceIncrement += reward;
          userStats.wins += 1;

          winningPredictionUpdates.push(
            tx.prediction.update({ where: { id: pred.id }, data: { status: PredictionStatus.WON, reward } })
          );
        } else {
          userStats.losses += 1;
        }
      }

      // 4. Execute updates efficiently
      // Update all lost predictions in one query
      await tx.prediction.updateMany({
        where: { marketId: id, outcomeId: { not: winningOutcomeId } },
        data: { status: PredictionStatus.LOST, reward: 0 }
      });

      // Process winning predictions in chunks
      const chunkSize = 100;
      for (let i = 0; i < winningPredictionUpdates.length; i += chunkSize) {
        await Promise.all(winningPredictionUpdates.slice(i, i + chunkSize));
      }

      // Process user stats in chunks
      const userUpdatePromises = Array.from(userUpdates.entries()).map(([userId, stats]) => {
        return tx.user.update({
          where: { id: userId },
          data: { 
            balance: { increment: stats.balanceIncrement }, 
            predictionsWon: { increment: stats.wins },
            wins: { increment: stats.wins },
            predictionsLost: { increment: stats.losses },
            losses: { increment: stats.losses }
          }
        });
      });

      for (let i = 0; i < userUpdatePromises.length; i += chunkSize) {
        await Promise.all(userUpdatePromises.slice(i, i + chunkSize));
      }

      await tx.auditLog.create({
        data: { userId: null, action: AuditAction.MARKET_RESOLVED, entity: 'Market', entityId: id }
      });

      return { success: true };
    }, {
      timeout: 120000,
    });
  }

  async cancelMarket(id: string) {
    const market = await this.prisma.market.findUnique({ where: { id }, include: { predictions: true } });
    if (!market || market.status === MarketStatus.RESOLVED || market.status === MarketStatus.CANCELLED) {
      throw new BadRequestException('Cannot cancel this market');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.market.update({ where: { id }, data: { status: MarketStatus.CANCELLED } });

      // Refund all predictions efficiently
      await tx.prediction.updateMany({ 
        where: { marketId: id }, 
        data: { status: PredictionStatus.REFUNDED } 
      });

      const userRefunds = new Map<string, number>();
      for (const pred of market.predictions) {
        userRefunds.set(pred.userId, (userRefunds.get(pred.userId) || 0) + pred.stake);
      }

      const userUpdatePromises = Array.from(userRefunds.entries()).map(([userId, refundAmount]) => {
        return tx.user.update({
          where: { id: userId },
          data: { balance: { increment: refundAmount } }
        });
      });

      const chunkSize = 100;
      for (let i = 0; i < userUpdatePromises.length; i += chunkSize) {
        await Promise.all(userUpdatePromises.slice(i, i + chunkSize));
      }

      await tx.auditLog.create({
        data: { userId: null, action: AuditAction.MARKET_CANCELLED, entity: 'Market', entityId: id }
      });
    }, {
      timeout: 120000,
    });

    this.wsService.emitMarketUpdate(id, { status: MarketStatus.CANCELLED });

    return { success: true };
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleExpiredMarkets() {
    // A market is expired if it has an endsAt, it's older than 10 minutes from now, 
    // it's a CUSTOM market, and it hasn't been resolved or cancelled.
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);

    const expiredMarkets = await this.prisma.market.findMany({
      where: {
        endsAt: {
          lt: tenMinsAgo,
        },
        category: 'CUSTOM',
        status: {
          in: [MarketStatus.OPEN, MarketStatus.LOCKED],
        },
      },
    });

    for (const market of expiredMarkets) {
      try {
        this.logger.log(`Auto-cancelling expired custom market ${market.id} (${market.title})`);
        await this.cancelMarket(market.id);
      } catch (error) {
        this.logger.error(`Failed to auto-cancel market ${market.id}: ${error.message}`);
      }
    }
  }
}
