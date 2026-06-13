import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from '@upstash/redis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor(private configService: ConfigService) {
    const url = this.configService.get<string>('UPSTASH_REDIS_REST_URL');
    const token = this.configService.get<string>('UPSTASH_REDIS_REST_TOKEN');

    if (url && token) {
      this.client = new Redis({ url, token });
      this.logger.log(`Connected to Upstash Redis REST API`);
    } else {
      this.logger.error('Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN environment variables');
      this.client = new Redis({ url: 'https://fake-url.upstash.io', token: 'fake' });
    }
  }

  async onModuleDestroy() {
  }

  async get<T = string>(key: string): Promise<T | null> {
    const data = await this.client.get<T>(key);
    return data;
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, { ex: ttlSeconds });
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async expire(key: string, seconds: number): Promise<void> {
    await this.client.expire(key, seconds);
  }

  async zadd(key: string, score: number, member: string): Promise<void> {
    await this.client.zadd(key, { score, member });
  }

  async zrevrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.client.zrange(key, start, stop, { rev: true });
  }

  async zrevrangeWithScores(
    key: string,
    start: number,
    stop: number,
  ): Promise<{ member: string; score: number }[]> {
    const result = await this.client.zrange(key, start, stop, { rev: true, withScores: true }) as any[];
    const entries: { member: string; score: number }[] = [];
    
    if (result && result.length > 0 && typeof result[0] !== 'object') {
      for (let i = 0; i < result.length; i += 2) {
        entries.push({
          member: String(result[i]),
          score: Number(result[i + 1]),
        });
      }
    } else if (result && result.length > 0 && typeof result[0] === 'object') {
       for (const item of result) {
         entries.push({
           member: String(item.member || item.value),
           score: Number(item.score),
         });
       }
    }
    return entries;
  }

  async zrank(key: string, member: string): Promise<number | null> {
    return this.client.zrank(key, member);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  async keys(pattern: string): Promise<string[]> {
    return this.client.keys(pattern);
  }
}
