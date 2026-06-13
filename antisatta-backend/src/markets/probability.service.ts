import { Injectable } from '@nestjs/common';

/**
 * Parimutuel Pool Probability Engine
 *
 * Probability = OutcomePool / TotalPool
 *
 * This service recalculates probabilities for all outcomes
 * in a market whenever a prediction is placed.
 */
@Injectable()
export class ProbabilityService {
  /**
   * Calculate probability for a single outcome
   */
  calculateProbability(outcomePool: number, totalPool: number): number {
    if (totalPool === 0) return 0;
    return Number((outcomePool / totalPool).toFixed(4));
  }

  /**
   * Recalculate probabilities for all outcomes in a market (Parimutuel)
   */
  recalculateAll(
    outcomes: { id: string; poolTokens: number }[],
    totalPool: number,
  ): { id: string; probability: number }[] {
    return outcomes.map((outcome) => ({
      id: outcome.id,
      probability: this.calculateProbability(outcome.poolTokens, totalPool),
    }));
  }

  /**
   * Calculate AMM probabilities blending Base Probability and User Bets
   */
  calculateAmmProbabilities(
    outcomes: { id: string; name: string; poolTokens: number }[],
    baseProbabilities: Record<string, number>, // Map of outcome name -> base probability (0.0 to 1.0)
    virtualPoolSize: number = 10000,
  ): { id: string; probability: number }[] {
    const actualTotalPool = outcomes.reduce((sum, o) => sum + o.poolTokens, 0);
    const totalBlendedPool = actualTotalPool + virtualPoolSize;

    return outcomes.map((outcome) => {
      const baseProb = baseProbabilities[outcome.name] || 0.3333;
      const virtualTokens = baseProb * virtualPoolSize;
      const blendedProbability = (outcome.poolTokens + virtualTokens) / totalBlendedPool;
      
      return {
        id: outcome.id,
        probability: Number(Math.max(0.01, Math.min(0.99, blendedProbability)).toFixed(4)),
      };
    });
  }
}
