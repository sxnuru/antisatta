import { Module } from '@nestjs/common';
import { FootballService } from './football.service';
import { FootballSyncService } from './football-sync.service';
import { WebsocketModule } from '../websocket/websocket.module';
import { MarketsModule } from '../markets/markets.module';

@Module({
  imports: [WebsocketModule, MarketsModule],
  providers: [FootballService, FootballSyncService],
  exports: [FootballService, FootballSyncService],
})
export class FootballModule {}
