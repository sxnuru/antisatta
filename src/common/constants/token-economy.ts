// src/common/constants/token-economy.ts
// All token economy values as immutable constants

export const TOKEN_ECONOMY = {
  /** Tokens granted on user registration */
  SIGNUP_BONUS: 1000,

  /** Tokens granted for daily login */
  DAILY_LOGIN: 50,

  /** Tokens granted for 7-day login streak */
  WEEKLY_STREAK: 250,

  /** Consecutive days required for streak bonus */
  STREAK_DAYS: 7,

  /** Tokens granted to market creator when threshold is met */
  MARKET_CREATOR_REWARD: 25,

  /** Number of participants needed for market creator reward */
  MARKET_CREATOR_THRESHOLD: 20,

  /** Recovery tokens granted when balance is zero */
  RECOVERY_TOKENS: 10,

  /** Cooldown (ms) between recovery claims — 24 hours */
  RECOVERY_COOLDOWN_MS: 24 * 60 * 60 * 1000,

  /** Minimum stake per prediction */
  MIN_STAKE: 10,

  /** Maximum stake per prediction */
  MAX_STAKE: 5000,

  /** Minimum number of outcomes per market */
  MIN_OUTCOMES: 2,

  /** Maximum number of outcomes per market */
  MAX_OUTCOMES: 10,
} as const;

export const AUTH_CONFIG = {
  /** bcrypt hashing rounds */
  BCRYPT_ROUNDS: 12,

  /** JWT access token TTL */
  ACCESS_TOKEN_EXPIRY: '15m',

  /** JWT refresh token TTL */
  REFRESH_TOKEN_EXPIRY: '30d',

  /** Refresh token TTL in days (for DB expiry calculation) */
  REFRESH_TOKEN_DAYS: 30,

  /** Password reset token TTL in hours */
  PASSWORD_RESET_EXPIRY_HOURS: 1,

  /** Email verification token TTL in hours */
  EMAIL_VERIFY_EXPIRY_HOURS: 24,
} as const;
