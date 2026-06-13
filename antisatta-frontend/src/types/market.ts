export type MarketStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'OPEN' | 'LOCKED' | 'RESOLVED' | 'CANCELLED';
export type MarketType = 'FIFA_MATCH' | 'COMMUNITY';
export type MarketCategory =
  | 'FIFA_WORLD_CUP'
  | 'CHAMPIONS_LEAGUE'
  | 'PREMIER_LEAGUE'
  | 'LA_LIGA'
  | 'SERIE_A'
  | 'BUNDESLIGA'
  | 'LIGUE_1'
  | 'INTERNATIONAL'
  | 'TRANSFER'
  | 'PLAYER_PERFORMANCE'
  | 'CUSTOM';

export interface Outcome {
  id: string;
  marketId: string;
  name: string;
  poolTokens: number;
  probability: number;
  isWinner: boolean;
  sortOrder: number;
}

export interface Market {
  id: string;
  title: string;
  description: string;
  category: MarketCategory;
  marketType: MarketType;
  status: MarketStatus;
  creatorId: string;
  creator?: {
    id: string;
    username: string;
  };
  resolutionSource: string | null;
  winningOutcomeId: string | null;
  totalPool: number;
  participantCount: number;
  startsAt: string | null;
  endsAt: string;
  resolvedAt: string | null;
  featured: boolean;

  // FIFA-specific
  fixtureId: string | null;
  homeTeam: string | null;
  awayTeam: string | null;
  homeTeamLogo: string | null;
  awayTeamLogo: string | null;
  league: string | null;
  leagueLogo: string | null;
  season: string | null;
  matchScore: string | null;
  matchStatus: string | null;

  outcomes: Outcome[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateMarketInput {
  title: string;
  description: string;
  category: MarketCategory;
  resolutionSource?: string;
  outcomes: { name: string }[];
  endsAt: string;
  startsAt?: string;
}
