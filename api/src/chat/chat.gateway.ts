import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  OnGatewayConnection, OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway(3002,{cors:true})

export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect{
  private readonly logger = new Logger(ChatGateway.name);
  @WebSocketServer() server: Server
  handleConnection(client: Socket){
    this.logger.verbose('New client connected', client.id);
    client.broadcast.emit( `user-joined`, {
      message: `New user joined the chat: ${client.id}`,
      id: client.id
    })
  }

  handleDisconnect(client: Socket){
    this.logger.verbose('Client disconnected', client.id);
    this.server.emit( `user-left`, {
      message: `User left the chat: ${client.id}`,
      id: client.id
    })
  }

  @SubscribeMessage('newMessage')
  handleNewMessage( client: Socket,@MessageBody() message: any) {
    this.logger.debug(message);
    this.server.emit('message', message);
  }
}
