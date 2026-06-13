import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { UserRole, MarketStatus, PredictionStatus, AuditAction } from '@prisma/client';
import { PayoutService } from '../markets/payout.service';
import { MarketsService } from '../markets/markets.service';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private payout: PayoutService,
    private marketsService: MarketsService,
  ) {}

  async getDashboard() {
    const [usersCount, marketsCount, totalVolume] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.market.count(),
      this.prisma.market.aggregate({ _sum: { totalPool: true } }),
    ]);

    return {
      usersCount,
      marketsCount,
      totalVolume: totalVolume._sum.totalPool || 0,
    };
  }

  async getUsers(pagination: PaginationDto) {
    const { skip, take } = pagination;
    const [total, data] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.findMany({ skip, take, orderBy: { createdAt: 'desc' } }),
    ]);
    return { data, meta: { total, page: pagination.page || 1, limit: take, totalPages: Math.ceil(total / take), hasNext: skip + take < total, hasPrev: skip > 0 } };
  }

  async toggleBan(userId: string, reason?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const newBannedState = !user.banned;
    await this.prisma.user.update({
      where: { id: userId },
      data: { banned: newBannedState, banReason: newBannedState ? reason : null },
    });
    return { success: true, banned: newBannedState };
  }

  async changeRole(userId: string, role: UserRole) {
    await this.prisma.user.update({ where: { id: userId }, data: { role } });
    return { success: true };
  }

  async getMarkets(pagination: PaginationDto) {
    const { skip, take } = pagination;
    const [total, data] = await Promise.all([
      this.prisma.market.count(),
      this.prisma.market.findMany({ skip, take, orderBy: { createdAt: 'desc' } }),
    ]);
    return { data, meta: { total, page: pagination.page || 1, limit: take, totalPages: Math.ceil(total / take), hasNext: skip + take < total, hasPrev: skip > 0 } };
  }

  async approveMarket(id: string) {
    const market = await this.prisma.market.findUnique({ where: { id } });
    if (market?.status !== MarketStatus.PENDING_APPROVAL) throw new BadRequestException('Invalid status');
    
    await this.prisma.market.update({ where: { id }, data: { status: MarketStatus.OPEN } });
    
    return { success: true };
  }

  async rejectMarket(id: string, reason: string) {
    const market = await this.prisma.market.findUnique({ where: { id } });
    if (market?.status !== MarketStatus.PENDING_APPROVAL) throw new BadRequestException('Invalid status');
    
    await this.prisma.market.update({ where: { id }, data: { status: MarketStatus.CANCELLED } });
    
    return { success: true };
  }

  async toggleFeature(id: string) {
    const market = await this.prisma.market.findUnique({ where: { id } });
    if (!market) throw new NotFoundException();
    await this.prisma.market.update({ where: { id }, data: { featured: !market.featured } });
    return { success: true, featured: !market.featured };
  }

  async cancelMarket(id: string) {
    return this.marketsService.cancelMarket(id);
  }

  async resolveMarket(id: string, winningOutcomeId: string) {
    return this.marketsService.resolveMarket(id, winningOutcomeId);
  }

  async getAuditLogs(pagination: PaginationDto) {
    const { skip, take } = pagination;
    const [total, data] = await Promise.all([
      this.prisma.auditLog.count(),
      this.prisma.auditLog.findMany({ skip, take, orderBy: { createdAt: 'desc' }, include: { user: { select: { username: true } } } }),
    ]);
    return { data, meta: { total, page: pagination.page || 1, limit: take, totalPages: Math.ceil(total / take), hasNext: skip + take < total, hasPrev: skip > 0 } };
  }
}
