import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class LoggingService {
  constructor(private readonly logger: PinoLogger) {}

  logInfo(message: string, context?: any): void {
    this.logger.info(context, message);
  }

  logError(message: string, error?: Error, context?: any): void {
    const errorContext = {
      ...context,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : undefined,
    };
    this.logger.error(errorContext, message);
  }

  logWarn(message: string, context?: any): void {
    this.logger.warn(context, message);
  }

  logDebug(message: string, context?: any): void {
    this.logger.debug(context, message);
  }

  // Method for logging performance metrics without over-engineering
  logPerformance(operation: string, duration: number, context?: any): void {
    if (duration > 1000) {
      // Only log slow operations
      this.logWarn(`Slow operation: ${operation}`, {
        ...context,
        duration: Math.round(duration),
        type: 'performance',
      });
    }
  }
}
