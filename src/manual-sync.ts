import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FootballSyncService } from './football/football-sync.service';
import { FootballService } from './football/football.service';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const syncService = app.get(FootballSyncService);
  const espnService = app.get(FootballService);
  const prisma = app.get(PrismaService);

  console.log('Fetching raw events from ESPN...');
  const events = await espnService.getWorldCupScoreboard();
  console.log(`Found ${events.length} events!`);

  console.log('Manually triggering ESPN Sync...');
  try {
    await syncService.syncWorldCupLiveScores();
  } catch (e) {
    console.error("SYNC ERROR:", e);
  }
  
  const count = await prisma.market.count();
  console.log(`DB Markets count: ${count}`);
  
  console.log('Done.');
  await app.close();
}

bootstrap();
