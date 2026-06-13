import { Injectable } from '@nestjs/common';

/**
 * Payout Engine
 *
 * Reward = (UserStake / WinningPool) × TotalPool
 *
 * This service calculates rewards when a market is resolved.
 */
@Injectable()
export class PayoutService {
  /**
   * Calculate reward for a single prediction
   */
  calculateReward(userStake: number, winningPool: number, totalPool: number): number {
    if (winningPool === 0) return 0;
    return Math.floor((userStake / winningPool) * totalPool);
  }

  /**
   * Calculate all payouts for a resolved market
   */
  calculatePayouts(
    predictions: { id: string; userId: string; stake: number }[],
    winningPool: number,
    totalPool: number,
  ): { predictionId: string; userId: string; reward: number }[] {
    return predictions.map((prediction) => ({
      predictionId: prediction.id,
      userId: prediction.userId,
      reward: this.calculateReward(prediction.stake, winningPool, totalPool),
    }));
  }
}
