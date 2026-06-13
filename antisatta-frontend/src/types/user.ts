// Frontend TypeScript types mirroring backend entities

export interface User {
  id: string;
  username: string;
  email: string;
  balance: number;
  roi: number;
  wins: number;
  losses: number;
  marketsCreated: number;
  predictionsWon: number;
  predictionsLost: number;
  role: 'USER' | 'MODERATOR' | 'ADMIN';
  loginStreak: number;
  createdAt: string;
}

export interface PublicProfile {
  id: string;
  username: string;
  balance: number;
  roi: number;
  wins: number;
  losses: number;
  marketsCreated: number;
  predictionsWon: number;
  predictionsLost: number;
  createdAt: string;
}
