import { create } from 'zustand';
import type { Market } from '@/types/market';

interface MarketState {
  // Active market being viewed
  activeMarket: Market | null;

  // Actions
  setActiveMarket: (market: Market | null) => void;
  updateOutcomePools: (outcomes: { id: string; poolTokens: number; probability: number }[]) => void;
  updateTotalPool: (totalPool: number) => void;
  updateMatchScore: (score: string, status: string) => void;
}

export const useMarketStore = create<MarketState>()((set) => ({
  activeMarket: null,

  setActiveMarket: (market) => set({ activeMarket: market }),

  updateOutcomePools: (outcomes) =>
    set((state) => {
      if (!state.activeMarket) return state;
      return {
        activeMarket: {
          ...state.activeMarket,
          outcomes: state.activeMarket.outcomes.map((o) => {
            const update = outcomes.find((u) => u.id === o.id);
            if (update) {
              return {
                ...o,
                poolTokens: update.poolTokens,
                probability: update.probability,
              };
            }
            return o;
          }),
        },
      };
    }),

  updateTotalPool: (totalPool) =>
    set((state) => {
      if (!state.activeMarket) return state;
      return {
        activeMarket: {
          ...state.activeMarket,
          totalPool,
        },
      };
    }),

  updateMatchScore: (score, status) =>
    set((state) => {
      if (!state.activeMarket) return state;
      return {
        activeMarket: {
          ...state.activeMarket,
          matchScore: score,
          matchStatus: status,
        },
      };
    }),
}));
