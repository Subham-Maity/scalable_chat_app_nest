import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');
  private count = 0;

  use(request: Request, response: Response, next: NextFunction): void {
    /**uncomment the below lines to see the request details in the console*/
      // const { ip, method, originalUrl, headers, body, protocol } = request;
    const { ip, method, originalUrl } = request;
    const userAgent = request.get('user-agent') || '';

    const start = Date.now();

    response.on('finish', () => {
      const { statusCode } = response;
      const contentLength = response.get('content-length');

      const end = Date.now();
      const latency = end - start;

      this.count++;

      this.logger.log(
        `${this.count} ${method} ${originalUrl} ${statusCode} ${contentLength} - ${userAgent} ${ip} - ${latency}ms`,
      );

      /**
       //debugging purpose only - remove in production (uncomment the below lines to see the request details)
       this.logger.debug(`Headers: ${JSON.stringify(headers)}`);
       this.logger.debug(`Body: ${JSON.stringify(body)}`);
       this.logger.debug(`Protocol: ${protocol}`);
       */
    });

    next();
  }
}