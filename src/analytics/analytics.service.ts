import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getOverview() {
    const [totalUsers, totalMarkets, totalPredictions] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.market.count(),
      this.prisma.prediction.count(),
    ]);

    return { totalUsers, totalMarkets, totalPredictions };
  }

  async getMarketAnalytics() {
    return { message: 'Market analytics data' }; // Stub
  }

  async getUserAnalytics() {
    return { message: 'User analytics data' }; // Stub
  }
}
