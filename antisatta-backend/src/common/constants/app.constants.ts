// src/common/constants/app.constants.ts

export const APP_CONSTANTS = {
  /** Application name */
  APP_NAME: 'MatchMarket',

  /** API version prefix */
  API_PREFIX: 'api',

  /** Default pagination limit */
  DEFAULT_PAGE_SIZE: 20,

  /** Maximum pagination limit */
  MAX_PAGE_SIZE: 100,

  /** Maximum file upload size (5MB) */
  MAX_FILE_SIZE: 5 * 1024 * 1024,

  /** Allowed image MIME types */
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],

  /** Cloudinary upload folder */
  CLOUDINARY_FOLDER: 'matchmarket',

  /** Rate limiting: requests per minute */
  THROTTLE_TTL: 60000,

  /** Rate limiting: max requests per TTL */
  THROTTLE_LIMIT: 60,

  /** Redis key prefixes */
  REDIS_KEYS: {
    LEADERBOARD_DAILY: 'leaderboard:daily',
    LEADERBOARD_WEEKLY: 'leaderboard:weekly',
    LEADERBOARD_MONTHLY: 'leaderboard:monthly',
    LEADERBOARD_ALL_TIME: 'leaderboard:all-time',
    MARKET_CACHE: 'market:cache',
    USER_SESSION: 'user:session',
    RATE_LIMIT: 'rate:limit',
  },

  /** WebSocket event names */
  WS_EVENTS: {
    MARKET_JOIN: 'market:join',
    MARKET_LEAVE: 'market:leave',
    MARKET_UPDATE: 'market:update',
    PROBABILITY_UPDATE: 'probability:update',
    PREDICTION_NEW: 'prediction:new',
    SCORE_UPDATE: 'score:update',
    COMMENT_NEW: 'comment:new',
    LEADERBOARD_UPDATE: 'leaderboard:update',
    NOTIFICATION_NEW: 'notification:new',
  },
} as const;
