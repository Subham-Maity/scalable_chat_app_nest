import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

const port = process.env.PORT || 3000;
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(port);
  const logger = new Logger('Bootstrap');
  logger.verbose(`Server connected on ${port}`);
}
bootstrap();
