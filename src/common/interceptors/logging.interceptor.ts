import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { GqlExecutionContext } from '@nestjs/graphql';
import { performance } from 'perf_hooks';
import { throwError } from 'rxjs';
import { LoggingService } from '../services/logging.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly loggingService: LoggingService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = performance.now();
    const operationName = this.getOperationName(context);

    return next.handle().pipe(
      tap(() => {
        const duration = performance.now() - startTime;

        // Log slow operations (over 1 second)
        if (duration > 1000) {
          this.loggingService.logWarn('Slow operation detected', {
            operation: operationName,
            duration: Math.round(duration),
            type: 'slow_operation',
          });
        } else {
          this.loggingService.logDebug('Operation completed', {
            operation: operationName,
            duration: Math.round(duration),
          });
        }
      }),
      catchError((error) => {
        const duration = performance.now() - startTime;

        this.loggingService.logError('Operation failed', error, {
          operation: operationName,
          duration: Math.round(duration),
        });

        return throwError(() => error);
      }),
    );
  }

  private getOperationName(context: ExecutionContext): string {
    if (context.getType<string>() === 'graphql') {
      const gqlContext = GqlExecutionContext.create(context);
      const info = gqlContext.getInfo();
      return (
        info?.operation?.name?.value ||
        info?.fieldName ||
        'unknown_gql_operation'
      );
    } else {
      const request = context.switchToHttp().getRequest();
      return `${request?.method} ${request?.route?.path || request?.url}`;
    }
  }
}
