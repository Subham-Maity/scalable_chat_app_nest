import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { LoggerMiddleware } from './logger';
import { ChatModule } from './chat/chat.module';
import { RedisModule } from './redis';
import { ConfigModule } from '@nestjs/config';


@Module({
  imports: [
    ChatModule, RedisModule,ConfigModule.forRoot({
    isGlobal: true,
    cache: true,
  }),
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
