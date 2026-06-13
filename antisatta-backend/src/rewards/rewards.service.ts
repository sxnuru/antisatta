import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { RewardType, AuditAction } from '@prisma/client';
import { TOKEN_ECONOMY } from '../common/constants/token-economy';

@Injectable()
export class RewardsService {
  constructor(private prisma: PrismaService) {}

  async claimDaily(userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      
      const now = new Date();
      const lastLogin = user?.lastLoginDate;
      let streak = user?.loginStreak || 0;

      // Simplistic daily check: if last login was yesterday, increment streak.
      // If today, throw error. If older, reset streak.
      // For MVP, we'll assume it's just a cooldown of 24h.
      
      if (lastLogin && (now.getTime() - lastLogin.getTime()) < 24 * 60 * 60 * 1000) {
        throw new BadRequestException('Daily reward already claimed in the last 24 hours');
      }

      streak += 1;
      let rewardAmount = TOKEN_ECONOMY.DAILY_LOGIN;
      
      if (streak % 7 === 0) {
        rewardAmount += TOKEN_ECONOMY.WEEKLY_STREAK;
      }

      await tx.user.update({
        where: { id: userId },
        data: { balance: { increment: rewardAmount }, loginStreak: streak, lastLoginDate: now }
      });

      const reward = await tx.reward.create({
        data: { userId, type: RewardType.DAILY_LOGIN, amount: rewardAmount, description: `Daily login streak: ${streak}` }
      });

      await tx.auditLog.create({
        data: { userId, action: AuditAction.TOKENS_EARNED, entity: 'Reward', entityId: reward.id }
      });

      return { success: true, reward: rewardAmount, streak };
    });
  }

  async claimRecovery(userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      
      if (!user || user.balance > 0) {
        throw new BadRequestException('Balance must be 0 to claim recovery tokens');
      }

      const now = new Date();
      if (user.lastRecoveryClaim && (now.getTime() - user.lastRecoveryClaim.getTime()) < 24 * 60 * 60 * 1000) {
        throw new BadRequestException('Recovery claim on cooldown (24h)');
      }

      const rewardAmount = TOKEN_ECONOMY.RECOVERY_TOKENS;

      await tx.user.update({
        where: { id: userId },
        data: { balance: { increment: rewardAmount }, recoveryClaims: { increment: 1 }, lastRecoveryClaim: now }
      });

      const reward = await tx.reward.create({
        data: { userId, type: RewardType.RECOVERY, amount: rewardAmount, description: 'Recovery tokens' }
      });

      await tx.auditLog.create({
        data: { userId, action: AuditAction.RECOVERY_CLAIMED, entity: 'Reward', entityId: reward.id }
      });

      return { success: true, reward: rewardAmount };
    });
  }

  async getHistory(userId: string, pagination: PaginationDto) {
    const { skip, take } = pagination;
    const [total, data] = await Promise.all([
      this.prisma.reward.count({ where: { userId } }),
      this.prisma.reward.findMany({ where: { userId }, skip, take, orderBy: { createdAt: 'desc' } }),
    ]);
    return { data, meta: { total, page: pagination.page || 1, limit: take, totalPages: Math.ceil(total / take), hasNext: skip + take < total, hasPrev: skip > 0 } };
  }

  async getStreak(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    return { streak: user?.loginStreak || 0, lastLoginDate: user?.lastLoginDate };
  }
}
