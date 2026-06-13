import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { APP_CONSTANTS } from '../common/constants/app.constants';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/',
})
export class WebsocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebsocketGateway.name);

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.debug(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage(APP_CONSTANTS.WS_EVENTS.MARKET_JOIN)
  handleJoinMarket(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { marketId: string },
  ) {
    client.join(`market:${data.marketId}`);
    this.logger.debug(`Client ${client.id} joined market:${data.marketId}`);
  }

  @SubscribeMessage(APP_CONSTANTS.WS_EVENTS.MARKET_LEAVE)
  handleLeaveMarket(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { marketId: string },
  ) {
    client.leave(`market:${data.marketId}`);
    this.logger.debug(`Client ${client.id} left market:${data.marketId}`);
  }
}
