import { Injectable } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';
import { APP_CONSTANTS } from '../common/constants/app.constants';

/**
 * Service for broadcasting real-time events through Socket.IO
 * Used by other services to emit events to connected clients
 */
@Injectable()
export class WebsocketService {
  constructor(private gateway: WebsocketGateway) {}

  /** Emit market update to all clients in the market room */
  emitMarketUpdate(marketId: string, data: any) {
    this.gateway.server
      .to(`market:${marketId}`)
      .emit(APP_CONSTANTS.WS_EVENTS.MARKET_UPDATE, data);
  }

  /** Emit probability update to all clients in the market room */
  emitProbabilityUpdate(marketId: string, outcomes: any[]) {
    this.gateway.server
      .to(`market:${marketId}`)
      .emit(APP_CONSTANTS.WS_EVENTS.PROBABILITY_UPDATE, { marketId, outcomes });
  }

  /** Emit new prediction to the market room */
  emitNewPrediction(marketId: string, prediction: any) {
    this.gateway.server
      .to(`market:${marketId}`)
      .emit(APP_CONSTANTS.WS_EVENTS.PREDICTION_NEW, { marketId, prediction });
  }

  /** Emit live score update */
  emitScoreUpdate(marketId: string, score: string, status: string) {
    this.gateway.server
      .to(`market:${marketId}`)
      .emit(APP_CONSTANTS.WS_EVENTS.SCORE_UPDATE, { marketId, score, status });
  }

  /** Emit new comment to the market room */
  emitNewComment(marketId: string, comment: any) {
    this.gateway.server
      .to(`market:${marketId}`)
      .emit(APP_CONSTANTS.WS_EVENTS.COMMENT_NEW, { marketId, comment });
  }

  /** Emit leaderboard update to all connected clients */
  emitLeaderboardUpdate(leaderboard: any[]) {
    this.gateway.server.emit(APP_CONSTANTS.WS_EVENTS.LEADERBOARD_UPDATE, {
      leaderboard,
    });
  }

  /** Emit notification to a specific user */
  emitNotification(userId: string, notification: any) {
    this.gateway.server.emit(APP_CONSTANTS.WS_EVENTS.NOTIFICATION_NEW, {
      userId,
      notification,
    });
  }
}
