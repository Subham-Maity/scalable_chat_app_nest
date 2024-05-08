import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { PubSubService } from '../redis/pubsub.service';

@WebSocketGateway(3002, { cors: true })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(ChatGateway.name);
  // Inject the RedisService
  constructor(private pubSubService: PubSubService) {
    this.pubSubService.subscribe('chat', (message) => {
      this.server.emit('message', message);
    });
  }

  handleConnection(client: Socket) {
    this.logger.verbose('New client connected', client.id);
    client.broadcast.emit(`user-joined`, {
      message: `New user joined the chat: ${client.id}`,
      id: client.id,
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.verbose('Client disconnected', client.id);
    this.server.emit(`user-left`, {
      message: `User left the chat: ${client.id}`,
      id: client.id,
    });
  }

  @SubscribeMessage('newMessage')
  async handleNewMessage(@MessageBody() message: any) {
    this.logger.debug(message);
    //Shift this to the redis service
    // this.server.emit('message', message);

    // Publish the message to the Redis channel
    this.pubSubService.publish('chat', JSON.stringify(message));
  }
}
