import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { RedisModule } from '../redis';

@Module({
  imports: [RedisModule],
  providers: [ChatGateway],
})
export class ChatModule {}
