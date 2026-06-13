import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { FootballService } from './football.service';
import { PrismaService } from '../prisma/prisma.service';
import { WebsocketService } from '../websocket/websocket.service';
import { MarketsService } from '../markets/markets.service';
import { ProbabilityService } from '../markets/probability.service';

@Injectable()
export class FootballSyncService {
  private readonly logger = new Logger(FootballSyncService.name);

  constructor(
    private footballService: FootballService,
    private prisma: PrismaService,
    private wsService: WebsocketService,
    private marketsService: MarketsService,
    private probabilityService: ProbabilityService,
  ) {}

  /**
   * Poll ESPN API every 30 seconds for live World Cup matches
   */
  @Cron('*/30 * * * * *')
  async syncWorldCupLiveScores() {
    try {
      const events = await this.footballService.getWorldCupScoreboard();
      
      // Get the admin user for market creation
      const adminUser = await this.prisma.user.findFirst({
        where: { role: 'ADMIN' },
      });

      if (!adminUser) {
        this.logger.warn('No Admin user found to create markets. Skipping sync.');
        return;
      }

      // Pre-fetch all existing markets for these fixtures
      const fixtureIds = events.map((e: any) => e.id);
      const existingMarketsList = await this.prisma.market.findMany({
        where: { fixtureId: { in: fixtureIds } },
        include: { outcomes: true },
      });
      const marketMap = new Map(existingMarketsList.map((m) => [m.fixtureId, m]));

      for (const event of events) {
        const fixtureId = event.id;
        const name = event.name; // e.g. "United States at Paraguay"
        const startsAt = new Date(event.date);
        
        const homeCompetitor = event.competitions[0].competitors.find((c: any) => c.homeAway === 'home') || event.competitions[0].competitors[0];
        const awayCompetitor = event.competitions[0].competitors.find((c: any) => c.homeAway === 'away') || event.competitions[0].competitors[1];
        
        const homeTeam = homeCompetitor.team.displayName;
        const awayTeam = awayCompetitor.team.displayName;
        const homeLogo = homeCompetitor.team.logo;
        const awayLogo = awayCompetitor.team.logo;
        const homeScore = homeCompetitor.score;
        const awayScore = awayCompetitor.score;
        const matchScore = `${homeScore}-${awayScore}`;

        let status = 'OPEN';
        let matchStatus = event.status.type.state; // 'pre', 'in', 'post'
        
        if (matchStatus === 'in') {
          matchStatus = 'IN_PLAY';
        } else if (matchStatus === 'post') {
          matchStatus = 'FINISHED';
          status = 'RESOLVED';
        } else {
          matchStatus = 'NOT_STARTED';
        }

        const title = `${homeTeam} vs ${awayTeam}`;
        const endsAt = new Date(startsAt.getTime() + 2 * 60 * 60 * 1000); // Rough estimate for match end

        // Find existing market
        let market = marketMap.get(fixtureId);

        if (!market) {
          // Create market if it doesn't exist
          market = await this.prisma.market.create({
            data: {
              title,
              description: `Predict the winner of the FIFA World Cup match between ${homeTeam} and ${awayTeam}.`,
              category: 'FIFA_WORLD_CUP',
              marketType: 'FIFA_MATCH',
              status: status as any,
              creatorId: adminUser.id,
              fixtureId,
              startsAt,
              endsAt,
              homeTeam,
              awayTeam,
              homeTeamLogo: homeLogo,
              awayTeamLogo: awayLogo,
              matchScore,
              matchStatus,
              totalPool: 0,
              participantCount: 0,
              outcomes: {
                create: [
                  { name: homeTeam, poolTokens: 0, probability: 0.33, sortOrder: 1 },
                  { name: 'Draw', poolTokens: 0, probability: 0.34, sortOrder: 2 },
                  { name: awayTeam, poolTokens: 0, probability: 0.33, sortOrder: 3 },
                ]
              }
            },
            include: { outcomes: true }
          });
          this.logger.log(`Created market for ${title}`);
        } else {
          // Update existing market if score or status changed
          if (market.matchScore !== matchScore || market.matchStatus !== matchStatus) {
            
            // If the match just finished, we need to officially resolve it and pay out
            if (matchStatus === 'FINISHED' && market.status !== 'RESOLVED' && market.status !== 'CANCELLED') {
              let winnerName = 'Draw';
              if (homeScore > awayScore) winnerName = homeTeam;
              if (awayScore > homeScore) winnerName = awayTeam;
              
              const winningOutcome = market.outcomes.find((o: any) => o.name === winnerName);
              
              if (winningOutcome) {
                // Update score before resolving
                await this.prisma.market.update({
                  where: { id: market.id },
                  data: { matchScore, matchStatus },
                });
                
                await this.marketsService.resolveMarket(market.id, winningOutcome.id);
                this.logger.log(`Resolved market ${title} - Winner: ${winnerName}`);
                
                // Emit websocket event
                this.wsService.emitMarketUpdate(market.id, {
                  matchScore,
                  matchStatus,
                  status: 'RESOLVED'
                });
                continue; // Skip the regular update
              }
            }
            
            market = await this.prisma.market.update({
              where: { id: market.id },
              data: { matchScore, matchStatus, status: status as any },
              include: { outcomes: true }
            });

            // Calculate new AMM probabilities based on score
            const baseProbs = this.calculateBaseProbabilities(homeScore, awayScore, homeTeam, awayTeam);
            const ammProbs = this.probabilityService.calculateAmmProbabilities(market.outcomes, baseProbs, 10000);
            
            for (const prob of ammProbs) {
               await this.prisma.outcome.update({
                 where: { id: prob.id },
                 data: { probability: prob.probability }
               });
            }

            this.logger.log(`Updated market ${title} - Score: ${matchScore}, Status: ${matchStatus}`);
            
            // Emit websocket event
            this.wsService.emitMarketUpdate(market!.id, {
              matchScore,
              matchStatus,
              status
            });
          }
        }
      }
    } catch (error) {
      this.logger.error(`Error in syncWorldCupLiveScores: ${error.message}`);
    }
  }

  private calculateBaseProbabilities(homeScore: number, awayScore: number, homeTeam: string, awayTeam: string) {
    const diff = homeScore - awayScore;
    let baseProbs: Record<string, number> = { [homeTeam]: 0.33, 'Draw': 0.34, [awayTeam]: 0.33 };

    if (diff > 0) {
      baseProbs[homeTeam] = Math.min(0.95, 0.50 + (diff * 0.15));
      baseProbs['Draw'] = Math.max(0.01, 0.30 - (diff * 0.10));
      baseProbs[awayTeam] = Math.max(0.01, 0.20 - (diff * 0.05));
    } else if (diff < 0) {
      baseProbs[awayTeam] = Math.min(0.95, 0.50 + (Math.abs(diff) * 0.15));
      baseProbs['Draw'] = Math.max(0.01, 0.30 - (Math.abs(diff) * 0.10));
      baseProbs[homeTeam] = Math.max(0.01, 0.20 - (Math.abs(diff) * 0.05));
    }
    
    // Normalize to 1.0
    const sum = baseProbs[homeTeam] + baseProbs['Draw'] + baseProbs[awayTeam];
    baseProbs[homeTeam] /= sum;
    baseProbs['Draw'] /= sum;
    baseProbs[awayTeam] /= sum;

    return baseProbs;
  }
}
