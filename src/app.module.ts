import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { TerminusModule } from '@nestjs/terminus';
import * as Joi from 'joi';

// Infrastructure modules
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';

// Feature modules
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MarketsModule } from './markets/markets.module';
import { OutcomesModule } from './outcomes/outcomes.module';
import { PredictionsModule } from './predictions/predictions.module';
import { CommentsModule } from './comments/comments.module';
import { RewardsModule } from './rewards/rewards.module';
import { AchievementsModule } from './achievements/achievements.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { FootballModule } from './football/football.module';
import { WebsocketModule } from './websocket/websocket.module';
import { AdminModule } from './admin/admin.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    // ── Configuration ─────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number().default(4000),
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        JWT_REFRESH_SECRET: Joi.string().required(),
        FRONTEND_URL: Joi.string().required(),
        REDIS_URL: Joi.string().required(),
        API_FOOTBALL_KEY: Joi.string().optional(),
      }),
    }),

    // ── Rate Limiting ─────────────────────────────────
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 60,
      },
    ]),

    // ── Scheduled Tasks ───────────────────────────────
    ScheduleModule.forRoot(),

    // ── Health Checks ─────────────────────────────────
    TerminusModule,

    // ── Infrastructure ────────────────────────────────
    PrismaModule,
    RedisModule,

    // ── Feature Modules ───────────────────────────────
    AuthModule,
    UsersModule,
    MarketsModule,
    OutcomesModule,
    PredictionsModule,
    CommentsModule,
    RewardsModule,
    AchievementsModule,
    LeaderboardModule,
    FootballModule,
    WebsocketModule,
    AdminModule,
    AnalyticsModule,
    HealthModule,
  ],
})
export class AppModule {}
