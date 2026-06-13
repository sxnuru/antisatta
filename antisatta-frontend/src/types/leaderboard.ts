export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  balance: number;
  roi: number;
  wins: number;
  losses: number;
  winRate: number;
  profit: number;
}

export type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly' | 'all-time';
export type LeaderboardSortBy = 'roi' | 'profit' | 'winRate';
