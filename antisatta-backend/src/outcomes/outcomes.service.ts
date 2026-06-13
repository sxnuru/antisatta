import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OutcomesService {
  constructor(private prisma: PrismaService) {}

  async getByMarket(marketId: string) {
    const outcomes = await this.prisma.outcome.findMany({
      where: { marketId },
      orderBy: { sortOrder: 'asc' },
    });

    if (!outcomes.length) {
      // Validate market exists
      const market = await this.prisma.market.findUnique({ where: { id: marketId } });
      if (!market) throw new NotFoundException('Market not found');
    }

    return outcomes;
  }
}
