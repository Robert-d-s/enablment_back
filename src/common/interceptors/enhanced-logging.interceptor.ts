import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { GqlExecutionContext } from '@nestjs/graphql';
import { PinoLogger } from 'nestjs-pino';
import { performance } from 'perf_hooks';
import { Request } from 'express';

interface RequestMetrics {
  startTime: number;
  endTime: number;
  duration: number;
  memoryBefore: NodeJS.MemoryUsage;
  memoryAfter: NodeJS.MemoryUsage;
  cpuBefore: NodeJS.CpuUsage;
  cpuAfter: NodeJS.CpuUsage;
}

interface OperationContext {
  requestId: string;
  operationName?: string;
  operationType?: string;
  userId?: string;
  ipAddress: string;
  userAgent: string;
  correlationId: string;
}

@Injectable()
export class EnhancedLoggingInterceptor implements NestInterceptor {
  private readonly performanceMetrics = new Map<string, RequestMetrics>();
  private readonly operationCounters = new Map<string, number>();
  private readonly slowOperationThreshold = 1000; // 1 second
  private readonly memoryLeakThreshold = 50 * 1024 * 1024; // 50MB

  constructor(private readonly logger: PinoLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = performance.now();
    const memoryBefore = process.memoryUsage();
    const cpuBefore = process.cpuUsage();

    const operationContext = this.buildOperationContext(context);
    const correlationId = this.generateCorrelationId();

    // Log request start
    this.logger.info(
      {
        type: 'REQUEST_START',
        context: operationContext,
        correlationId,
        timestamp: new Date().toISOString(),
        memoryUsage: memoryBefore,
        cpuUsage: cpuBefore,
      },
      `Starting ${operationContext.operationType || 'operation'}: ${operationContext.operationName || 'unknown'}`,
    );

    // Track operation frequency
    this.trackOperationFrequency(operationContext.operationName || 'unknown');

    return next.handle().pipe(
      tap((data) => {
        const endTime = performance.now();
        const memoryAfter = process.memoryUsage();
        const cpuAfter = process.cpuUsage(cpuBefore);

        const metrics: RequestMetrics = {
          startTime,
          endTime,
          duration: endTime - startTime,
          memoryBefore,
          memoryAfter,
          cpuBefore,
          cpuAfter,
        };

        this.analyzePerformance(metrics, operationContext, correlationId);
        this.logSuccess(data, metrics, operationContext, correlationId);
      }),
      catchError((error) => {
        const endTime = performance.now();
        const memoryAfter = process.memoryUsage();
        const cpuAfter = process.cpuUsage(cpuBefore);

        const metrics: RequestMetrics = {
          startTime,
          endTime,
          duration: endTime - startTime,
          memoryBefore,
          memoryAfter,
          cpuBefore,
          cpuAfter,
        };

        this.logError(error, metrics, operationContext, correlationId);
        throw error;
      }),
    );
  }

  private buildOperationContext(context: ExecutionContext): OperationContext {
    const requestId = this.generateRequestId();

    if (context.getType<string>() === 'graphql') {
      const gqlContext = GqlExecutionContext.create(context);
      const info = gqlContext.getInfo();
      const request = gqlContext.getContext().req as Request;

      return {
        requestId,
        operationName: info?.operation?.name?.value,
        operationType: info?.operation?.operation,
        userId: (request as any)?.user?.id,
        ipAddress: this.extractIpAddress(request),
        userAgent: request?.headers['user-agent'] || 'unknown',
        correlationId: this.generateCorrelationId(),
      };
    } else {
      const request = context.switchToHttp().getRequest<Request>();
      return {
        requestId,
        operationName: request?.route?.path,
        operationType: request?.method,
        userId: (request as any)?.user?.id,
        ipAddress: this.extractIpAddress(request),
        userAgent: request?.headers['user-agent'] || 'unknown',
        correlationId: this.generateCorrelationId(),
      };
    }
  }

  private trackOperationFrequency(operationName: string): void {
    const count = this.operationCounters.get(operationName) || 0;
    this.operationCounters.set(operationName, count + 1);

    // Log high-frequency operations
    if (count > 0 && count % 100 === 0) {
      this.logger.warn(
        {
          operationName,
          count: count + 1,
          timestamp: new Date().toISOString(),
        },
        `High frequency operation detected: ${operationName} called ${count + 1} times`,
      );
    }
  }

  private analyzePerformance(
    metrics: RequestMetrics,
    context: OperationContext,
    correlationId: string,
  ): void {
    // Check for slow operations
    if (metrics.duration > this.slowOperationThreshold) {
      this.logger.warn(
        {
          type: 'SLOW_OPERATION',
          context,
          correlationId,
          metrics: {
            duration: Math.round(metrics.duration * 100) / 100,
            cpuUsage: {
              user: metrics.cpuAfter.user - metrics.cpuBefore.user,
              system: metrics.cpuAfter.system - metrics.cpuBefore.system,
            },
            memoryDelta: {
              heapUsed:
                metrics.memoryAfter.heapUsed - metrics.memoryBefore.heapUsed,
              external:
                metrics.memoryAfter.external - metrics.memoryBefore.external,
            },
          },
        },
        `Slow operation detected: ${context.operationName} took ${Math.round(metrics.duration)}ms`,
      );
    }

    // Check for memory leaks
    const memoryDelta =
      metrics.memoryAfter.heapUsed - metrics.memoryBefore.heapUsed;
    if (memoryDelta > this.memoryLeakThreshold) {
      this.logger.error(
        {
          type: 'MEMORY_LEAK_SUSPECT',
          context,
          correlationId,
          memoryDelta: {
            heapUsed: memoryDelta,
            external:
              metrics.memoryAfter.external - metrics.memoryBefore.external,
            rss: metrics.memoryAfter.rss - metrics.memoryBefore.rss,
          },
        },
        `Potential memory leak detected in ${context.operationName}: ${Math.round(memoryDelta / 1024 / 1024)}MB increase`,
      );
    }

    // Store metrics for trend analysis
    this.performanceMetrics.set(correlationId, metrics);

    // Clean up old metrics (keep only last 1000)
    if (this.performanceMetrics.size > 1000) {
      const oldestKey = this.performanceMetrics.keys().next().value;
      this.performanceMetrics.delete(oldestKey);
    }
  }

  private logSuccess(
    data: any,
    metrics: RequestMetrics,
    context: OperationContext,
    correlationId: string,
  ): void {
    const responseSize = this.calculateResponseSize(data);

    this.logger.info(
      {
        type: 'REQUEST_SUCCESS',
        context,
        correlationId,
        metrics: {
          duration: Math.round(metrics.duration * 100) / 100,
          responseSize,
          memoryUsage: {
            before: Math.round(metrics.memoryBefore.heapUsed / 1024 / 1024),
            after: Math.round(metrics.memoryAfter.heapUsed / 1024 / 1024),
            delta: Math.round(
              (metrics.memoryAfter.heapUsed - metrics.memoryBefore.heapUsed) /
                1024 /
                1024,
            ),
          },
          cpuUsage: {
            user: metrics.cpuAfter.user - metrics.cpuBefore.user,
            system: metrics.cpuAfter.system - metrics.cpuBefore.system,
          },
        },
        timestamp: new Date().toISOString(),
      },
      `Completed ${context.operationType || 'operation'}: ${context.operationName || 'unknown'} in ${Math.round(metrics.duration)}ms`,
    );
  }

  private logError(
    error: any,
    metrics: RequestMetrics,
    context: OperationContext,
    correlationId: string,
  ): void {
    this.logger.error(
      {
        type: 'REQUEST_ERROR',
        context,
        correlationId,
        error: {
          name: error?.name,
          message: error?.message,
          stack: error?.stack,
          code: error?.code,
        },
        metrics: {
          duration: Math.round(metrics.duration * 100) / 100,
          memoryUsage: {
            before: Math.round(metrics.memoryBefore.heapUsed / 1024 / 1024),
            after: Math.round(metrics.memoryAfter.heapUsed / 1024 / 1024),
            delta: Math.round(
              (metrics.memoryAfter.heapUsed - metrics.memoryBefore.heapUsed) /
                1024 /
                1024,
            ),
          },
          cpuUsage: {
            user: metrics.cpuAfter.user - metrics.cpuBefore.user,
            system: metrics.cpuAfter.system - metrics.cpuBefore.system,
          },
        },
        timestamp: new Date().toISOString(),
      },
      `Error in ${context.operationType || 'operation'}: ${context.operationName || 'unknown'} after ${Math.round(metrics.duration)}ms`,
    );
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  }

  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private extractIpAddress(request: Request): string {
    return (
      (request?.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      (request?.headers['x-real-ip'] as string) ||
      request?.connection?.remoteAddress ||
      request?.socket?.remoteAddress ||
      'unknown'
    );
  }
  private calculateResponseSize(data: any): number {
    try {
      return JSON.stringify(data).length;
    } catch {
      return 0;
    }
  }
}
