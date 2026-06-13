import { Module } from '@nestjs/common';
import { MarketsController } from './markets.controller';
import { MarketsService } from './markets.service';
import { ProbabilityService } from './probability.service';
import { PayoutService } from './payout.service';

import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [WebsocketModule],
  controllers: [MarketsController],
  providers: [MarketsService, ProbabilityService, PayoutService],
  exports: [MarketsService, ProbabilityService, PayoutService],
})
export class MarketsModule {}
