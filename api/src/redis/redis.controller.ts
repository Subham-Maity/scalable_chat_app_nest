import {
  Controller,
  Delete,
  Get,
  NotFoundException,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { RedisService } from './redis.service';

@Controller('redis')
export class RedisController {
  constructor(private readonly redisService: RedisService) {}

  @Get('reset-redis')
  async resetRedis() {
    try {
      await this.redisService.reset();
      return 'Redis cache cleared';
    } catch (error) {
      this.handleError(error);
    }
  }

  @Get()
  async getKey(@Query('key') key: string) {
    try {
      const value = await this.redisService.get(key);
      if (value === null) {
        throw new NotFoundException(`Key ${key} not found`);
      }
      return value;
    } catch (error) {
      this.handleError(error);
    }
  }

  @Delete()
  async deleteKey(@Query('key') key: string) {
    try {
      await this.redisService.del(key);
      return `${key} deleted`;
    } catch (error) {
      this.handleError(error);
    }
  }

  private handleError(error: any) {
    if (error instanceof Error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    } else {
      throw new HttpException(
        'An unexpected error occurred.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
