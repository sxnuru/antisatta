export type PredictionStatus = 'ACTIVE' | 'WON' | 'LOST' | 'REFUNDED';

export interface Prediction {
  id: string;
  userId: string;
  marketId: string;
  outcomeId: string;
  stake: number;
  reward: number | null;
  status: PredictionStatus;
  createdAt: string;
  market?: {
    id: string;
    title: string;
    status: string;
  };
  outcome?: {
    id: string;
    name: string;
    probability: number;
  };
}

export interface PlacePredictionInput {
  marketId: string;
  outcomeId: string;
  stake: number;
}
