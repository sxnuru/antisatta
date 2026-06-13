export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';

export const TOKEN_ECONOMY = {
  SIGNUP_BONUS: 1000,
  DAILY_LOGIN: 50,
  WEEKLY_STREAK: 250,
  REFERRAL_REWARD: 100,
  MARKET_CREATOR_REWARD: 25,
  RECOVERY_TOKENS: 10,
  MIN_STAKE: 10,
  MAX_STAKE: 5000,
} as const;

export const WS_EVENTS = {
  MARKET_JOIN: 'market:join',
  MARKET_LEAVE: 'market:leave',
  MARKET_UPDATE: 'market:update',
  PROBABILITY_UPDATE: 'probability:update',
  PREDICTION_NEW: 'prediction:new',
  SCORE_UPDATE: 'score:update',
  COMMENT_NEW: 'comment:new',
  LEADERBOARD_UPDATE: 'leaderboard:update',
  NOTIFICATION_NEW: 'notification:new',
} as const;
