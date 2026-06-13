import { Module } from '@nestjs/common';
import { PredictionsController } from './predictions.controller';
import { PredictionsService } from './predictions.service';
import { WebsocketModule } from '../websocket/websocket.module';
import { MarketsModule } from '../markets/markets.module';

@Module({
  imports: [WebsocketModule, MarketsModule],
  controllers: [PredictionsController],
  providers: [PredictionsService],
  exports: [PredictionsService],
})
export class PredictionsModule {}
