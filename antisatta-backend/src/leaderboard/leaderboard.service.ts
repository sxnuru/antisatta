import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeaderboardService {
  constructor(private prisma: PrismaService) {}

  async get(period: string, sortBy: string, limit: number) {
    const orderBy: any = {};
    if (sortBy === 'roi') orderBy.balance = 'desc'; // Account ROI is proportional to balance
    else if (sortBy === 'profit') orderBy.balance = 'desc';
    else if (sortBy === 'winRate') orderBy.predictionsWon = 'desc';
    else orderBy.balance = 'desc';

    // Parse limit to ensure it's a valid integer
    const parsedLimit = limit ? Number(limit) : 50;
    const take = isNaN(parsedLimit) ? 50 : parsedLimit;

    const users = await this.prisma.user.findMany({
      where: { banned: false },
      orderBy,
      take,
      select: {
        id: true,
        username: true,
        balance: true,
        wins: true,
        losses: true,
        predictionsWon: true,
        predictionsLost: true,
      },
    });

    return users.map((u, i) => {
      const total = u.predictionsWon + u.predictionsLost;
      const profit = u.balance - 1000;
      const accountRoi = (profit / 1000) * 100;
      return {
        ...u,
        userId: u.id,
        rank: i + 1,
        winRate: total > 0 ? Number(((u.predictionsWon / total) * 100).toFixed(2)) : 0,
        profit,
        roi: Number(accountRoi.toFixed(2)),
      };
    });
  }
}
