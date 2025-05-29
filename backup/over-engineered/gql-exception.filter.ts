import {
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { GqlExceptionFilter, GqlArgumentsHost } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';
import { GraphQLError } from 'graphql';
import { PinoLogger } from 'nestjs-pino';
import { Request } from 'express';
import { performance } from 'perf_hooks';

export interface ErrorContext {
  requestId?: string;
  userId?: string;
  operationName?: string;
  operationType?: string;
  fieldName?: string;
  path?: string[];
  timestamp: number;
  userAgent?: string;
  ipAddress?: string;
  correlationId?: string;
  sessionId?: string;
  traceId?: string;
}

export interface EnhancedErrorExtensions {
  code: string;
  statusCode?: number;
  timestamp: number;
  requestId?: string;
  correlationId?: string;
  context?: ErrorContext;
  validationErrors?: any[];
  prismaError?: {
    code: string;
    meta?: any;
    target?: string[];
  };
  performance?: {
    processingTime: number;
    memoryUsage: NodeJS.MemoryUsage;
  };
  retry?: {
    retryable: boolean;
    maxRetries?: number;
    backoffMs?: number;
  };
  rateLimit?: {
    limit: number;
    remaining: number;
    resetTime: number;
  };
  [key: string]: any; // Index signature for GraphQL compatibility
}

@Catch()
export class GlobalGqlExceptionFilter implements GqlExceptionFilter {
  private readonly errorCounts = new Map<string, number>();
  private readonly errorFirstSeen = new Map<string, number>();
  private readonly rateLimiters = new Map<string, { count: number; resetTime: number }>();
  private readonly correlationMap = new Map<string, ErrorContext>();

  constructor(private readonly logger: PinoLogger) {}

  catch(exception: unknown, host: ArgumentsHost): GraphQLError {
    const startTime = performance.now();
    const gqlHost = GqlArgumentsHost.create(host);
    const context = gqlHost.getContext();
    const info = gqlHost.getInfo();
    const request = context?.req as Request;

    // Generate correlation ID and context
    const errorContext = this.buildErrorContext(request, info, exception);
    const correlationId = this.generateCorrelationId();
    
    // Track error for analytics
    this.trackError(exception, errorContext);

    let graphqlError: GraphQLError;

    try {
      // Enhanced exception handling with detailed categorization
      if (exception instanceof HttpException) {
        graphqlError = this.handleHttpException(exception, errorContext, correlationId);
      } else if (this.isPrismaError(exception)) {
        graphqlError = this.handlePrismaError(exception as any, errorContext, correlationId);
      } else if (exception instanceof GraphQLError) {
        graphqlError = this.enhanceGraphQLError(exception, errorContext, correlationId);
      } else if (this.isValidationError(exception)) {
        graphqlError = this.handleValidationError(exception, errorContext, correlationId);
      } else if (this.isAuthenticationError(exception)) {
        graphqlError = this.handleAuthenticationError(exception, errorContext, correlationId);
      } else if (this.isAuthorizationError(exception)) {
        graphqlError = this.handleAuthorizationError(exception, errorContext, correlationId);
      } else if (this.isNetworkError(exception)) {
        graphqlError = this.handleNetworkError(exception, errorContext, correlationId);
      } else if (this.isBusinessLogicError(exception)) {
        graphqlError = this.handleBusinessLogicError(exception, errorContext, correlationId);
      } else {
        graphqlError = this.handleUnknownError(exception, errorContext, correlationId);
      }

      // Add performance metrics
      const processingTime = performance.now() - startTime;
      const memoryUsage = process.memoryUsage();
      
      const enhancedExtensions = {
        ...graphqlError.extensions,
        performance: {
          processingTime: Math.round(processingTime * 100) / 100,
          memoryUsage,
        },
      };

      graphqlError = new GraphQLError(graphqlError.message, {
        ...graphqlError,
        extensions: enhancedExtensions,
      });

      // Enhanced logging with structured data
      this.logError(exception, graphqlError, errorContext, processingTime);

      // Check for rate limiting
      this.checkRateLimit(errorContext, graphqlError);

      return graphqlError;
    } catch (filterError) {
      // Fallback error handling if the filter itself fails
      this.logger.error({
        originalException: this.serializeError(exception),
        filterError: this.serializeError(filterError),
        correlationId,
      }, 'Exception filter failed');

      return new GraphQLError('Internal server error', {
        extensions: {
          code: 'INTERNAL_SERVER_ERROR',
          correlationId,
          timestamp: Date.now(),
        },
      });
    }
  }

  private buildErrorContext(request: Request, info: any, exception: unknown): ErrorContext {
    return {
      requestId: request?.headers['x-request-id'] as string,
      userId: (request as any)?.user?.id,
      operationName: info?.operation?.name?.value,
      operationType: info?.operation?.operation,
      fieldName: info?.fieldName,
      path: info?.path ? this.buildPath(info.path) : [],
      timestamp: Date.now(),
      userAgent: request?.headers['user-agent'] as string,
      ipAddress: this.extractIpAddress(request),
      sessionId: request?.headers['x-session-id'] as string,
    };
  }

  private generateCorrelationId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private trackError(exception: unknown, context: ErrorContext): void {
    const errorKey = this.getErrorKey(exception);
    const currentTime = Date.now();
    
    // Increment error count
    this.errorCounts.set(errorKey, (this.errorCounts.get(errorKey) || 0) + 1);
    
    // Track first occurrence
    if (!this.errorFirstSeen.has(errorKey)) {
      this.errorFirstSeen.set(errorKey, currentTime);
    }

    // Log error frequency warnings
    const count = this.errorCounts.get(errorKey)!;
    const firstSeen = this.errorFirstSeen.get(errorKey)!;
    const minutesSinceFirst = (currentTime - firstSeen) / (1000 * 60);

    if (count > 10 && minutesSinceFirst < 5) {
      this.logger.warn({
        errorKey,
        count,
        minutesSinceFirst: Math.round(minutesSinceFirst),
        context,
      }, 'High frequency error detected');
    }
  }

  private handleHttpException(exception: HttpException, context: ErrorContext, correlationId: string): GraphQLError {
    const status = exception.getStatus();
    const response = exception.getResponse();
    
    let message = exception.message;
    let code = 'HTTP_ERROR';
    let extensions: EnhancedErrorExtensions = {
      code,
      statusCode: status,
      timestamp: Date.now(),
      correlationId,
      context,
    };

    if (typeof response === 'object' && response !== null) {
      const responseObj = response as any;
      message = Array.isArray(responseObj.message) 
        ? responseObj.message.join(', ') 
        : responseObj.message || message;
      
      if (responseObj.validationErrors) {
        extensions.validationErrors = responseObj.validationErrors;
      }
    }

    // Map HTTP status to GraphQL error codes
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        code = 'BAD_USER_INPUT';
        break;
      case HttpStatus.UNAUTHORIZED:
        code = 'UNAUTHENTICATED';
        break;
      case HttpStatus.FORBIDDEN:
        code = 'FORBIDDEN';
        break;
      case HttpStatus.NOT_FOUND:
        code = 'NOT_FOUND';
        break;
      case HttpStatus.CONFLICT:
        code = 'CONFLICT';
        break;
      case HttpStatus.TOO_MANY_REQUESTS:
        code = 'RATE_LIMITED';
        extensions.rateLimit = this.getRateLimitInfo(context);
        break;
      default:
        code = 'INTERNAL_SERVER_ERROR';
    }

    extensions.code = code;
    extensions.retry = this.getRetryInfo(status);

    return new GraphQLError(message, {
      extensions,
    });
  }

  private handlePrismaError(exception: Prisma.PrismaClientKnownRequestError, context: ErrorContext, correlationId: string): GraphQLError {
    let message = 'Database operation failed';
    let code = 'DATABASE_ERROR';
    
    const extensions: EnhancedErrorExtensions = {
      code,
      timestamp: Date.now(),
      correlationId,
      context,
      prismaError: {
        code: exception.code,
        meta: exception.meta,
      },
      retry: { retryable: false },
    };

    switch (exception.code) {
      case 'P2002':
        message = 'A record with this information already exists';
        code = 'DUPLICATE_ENTRY';
        break;
      case 'P2025':
        message = 'Record not found';
        code = 'NOT_FOUND';
        break;
      case 'P2003':
        message = 'Related record not found';
        code = 'FOREIGN_KEY_VIOLATION';
        break;
      case 'P2004':
        message = 'Database constraint violation';
        code = 'CONSTRAINT_VIOLATION';
        break;
      case 'P1001':
        message = 'Database connection failed';
        code = 'DATABASE_CONNECTION_ERROR';
        extensions.retry = { retryable: true, maxRetries: 3, backoffMs: 1000 };
        break;
      default:
        message = 'An unexpected database error occurred';
        extensions.retry = { retryable: true, maxRetries: 1, backoffMs: 500 };
    }

    extensions.code = code;

    return new GraphQLError(message, {
      extensions,
    });
  }

  private enhanceGraphQLError(exception: GraphQLError, context: ErrorContext, correlationId: string): GraphQLError {
    const extensions: EnhancedErrorExtensions = {
      ...exception.extensions,
      timestamp: Date.now(),
      correlationId,
      context,
    } as EnhancedErrorExtensions;

    return new GraphQLError(exception.message, {
      nodes: exception.nodes,
      source: exception.source,
      positions: exception.positions,
      path: exception.path,
      originalError: exception.originalError,
      extensions,
    });
  }

  private handleValidationError(exception: any, context: ErrorContext, correlationId: string): GraphQLError {
    return new GraphQLError('Validation failed', {
      extensions: {
        code: 'BAD_USER_INPUT',
        timestamp: Date.now(),
        correlationId,
        context,
        validationErrors: exception.validationErrors || [exception.message],
        retry: { retryable: false },
      },
    });
  }

  private handleAuthenticationError(exception: any, context: ErrorContext, correlationId: string): GraphQLError {
    return new GraphQLError('Authentication required', {
      extensions: {
        code: 'UNAUTHENTICATED',
        timestamp: Date.now(),
        correlationId,
        context,
        retry: { retryable: false },
      },
    });
  }

  private handleAuthorizationError(exception: any, context: ErrorContext, correlationId: string): GraphQLError {
    return new GraphQLError('Insufficient permissions', {
      extensions: {
        code: 'FORBIDDEN',
        timestamp: Date.now(),
        correlationId,
        context,
        retry: { retryable: false },
      },
    });
  }

  private handleNetworkError(exception: any, context: ErrorContext, correlationId: string): GraphQLError {
    return new GraphQLError('Network operation failed', {
      extensions: {
        code: 'NETWORK_ERROR',
        timestamp: Date.now(),
        correlationId,
        context,
        retry: { retryable: true, maxRetries: 3, backoffMs: 2000 },
      },
    });
  }

  private handleBusinessLogicError(exception: any, context: ErrorContext, correlationId: string): GraphQLError {
    return new GraphQLError(exception.message || 'Business logic error', {
      extensions: {
        code: 'BUSINESS_LOGIC_ERROR',
        timestamp: Date.now(),
        correlationId,
        context,
        retry: { retryable: false },
      },
    });
  }

  private handleUnknownError(exception: unknown, context: ErrorContext, correlationId: string): GraphQLError {
    const message = exception instanceof Error ? exception.message : 'An unexpected error occurred';
    
    return new GraphQLError(message, {
      extensions: {
        code: 'INTERNAL_SERVER_ERROR',
        timestamp: Date.now(),
        correlationId,
        context,
        retry: { retryable: true, maxRetries: 1, backoffMs: 1000 },
      },
    });
  }

  private isPrismaError(exception: unknown): boolean {
    return exception instanceof Prisma.PrismaClientKnownRequestError ||
           exception instanceof Prisma.PrismaClientUnknownRequestError ||
           exception instanceof Prisma.PrismaClientRustPanicError ||
           exception instanceof Prisma.PrismaClientInitializationError ||
           exception instanceof Prisma.PrismaClientValidationError;
  }

  private isValidationError(exception: unknown): boolean {
    return (exception as any)?.validationErrors !== undefined ||
           (exception as any)?.name === 'ValidationError';
  }

  private isAuthenticationError(exception: unknown): boolean {
    return (exception as any)?.name === 'UnauthorizedError' ||
           (exception as any)?.code === 'UNAUTHENTICATED';
  }

  private isAuthorizationError(exception: unknown): boolean {
    return (exception as any)?.name === 'ForbiddenError' ||
           (exception as any)?.code === 'FORBIDDEN';
  }

  private isNetworkError(exception: unknown): boolean {
    return (exception as any)?.code === 'ECONNREFUSED' ||
           (exception as any)?.code === 'ETIMEDOUT' ||
           (exception as any)?.name === 'NetworkError';
  }

  private isBusinessLogicError(exception: unknown): boolean {
    return (exception as any)?.name === 'BusinessLogicError' ||
           (exception as any)?.type === 'business-logic';
  }

  private logError(exception: unknown, graphqlError: GraphQLError, context: ErrorContext, processingTime: number): void {
    const errorData = {
      error: {
        message: graphqlError.message,
        code: graphqlError.extensions?.code,
        extensions: graphqlError.extensions,
      },
      context,
      performance: {
        processingTime,
        memoryUsage: process.memoryUsage(),
      },
      originalException: this.serializeError(exception),
    };

    if (graphqlError.extensions?.code === 'INTERNAL_SERVER_ERROR') {
      this.logger.error(errorData, 'GraphQL Error - Internal Server Error');
    } else if (graphqlError.extensions?.code === 'BAD_USER_INPUT') {
      this.logger.warn(errorData, 'GraphQL Error - Bad User Input');
    } else {
      this.logger.info(errorData, 'GraphQL Error - Client Error');
    }
  }

  private checkRateLimit(context: ErrorContext, graphqlError: GraphQLError): void {
    const key = context.userId || context.ipAddress || 'anonymous';
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    const maxErrors = 50;

    if (!this.rateLimiters.has(key)) {
      this.rateLimiters.set(key, { count: 0, resetTime: now + windowMs });
    }

    const limiter = this.rateLimiters.get(key)!;
    
    if (now > limiter.resetTime) {
      limiter.count = 0;
      limiter.resetTime = now + windowMs;
    }

    limiter.count++;

    if (limiter.count > maxErrors) {
      const extensions = graphqlError.extensions as any;
      extensions.rateLimit = {
        limit: maxErrors,
        remaining: 0,
        resetTime: limiter.resetTime,
      };
      
      this.logger.warn({
        key,
        count: limiter.count,
        limit: maxErrors,
        context,
      }, 'Error rate limit exceeded');
    }
  }
  private serializeError(error: unknown): any {
    if (error instanceof Error) {
      const { name, message, stack, ...rest } = error;
      return {
        name,
        message,
        stack,
        ...rest,
      };
    }
    return error;
  }

  private getErrorKey(exception: unknown): string {
    if (exception instanceof Error) {
      return `${exception.name}:${exception.message.substring(0, 100)}`;
    }
    return String(exception).substring(0, 100);
  }

  private buildPath(path: any): string[] {
    const result: string[] = [];
    let current = path;
    while (current) {
      if (typeof current.key === 'string' || typeof current.key === 'number') {
        result.unshift(String(current.key));
      }
      current = current.prev;
    }
    return result;
  }

  private extractIpAddress(request: Request): string {
    return (request?.headers['x-forwarded-for'] as string)?.split(',')[0] ||
           (request?.headers['x-real-ip'] as string) ||
           request?.connection?.remoteAddress ||
           request?.socket?.remoteAddress ||
           'unknown';
  }

  private getRateLimitInfo(context: ErrorContext): { limit: number; remaining: number; resetTime: number } {
    const key = context.userId || context.ipAddress || 'anonymous';
    const limiter = this.rateLimiters.get(key);
    
    if (!limiter) {
      return { limit: 50, remaining: 50, resetTime: Date.now() + 60000 };
    }

    return {
      limit: 50,
      remaining: Math.max(0, 50 - limiter.count),
      resetTime: limiter.resetTime,
    };
  }

  private getRetryInfo(status: number): { retryable: boolean; maxRetries?: number; backoffMs?: number } {
    switch (status) {
      case HttpStatus.TOO_MANY_REQUESTS:
        return { retryable: true, maxRetries: 3, backoffMs: 5000 };
      case HttpStatus.INTERNAL_SERVER_ERROR:
      case HttpStatus.BAD_GATEWAY:
      case HttpStatus.SERVICE_UNAVAILABLE:
      case HttpStatus.GATEWAY_TIMEOUT:
        return { retryable: true, maxRetries: 2, backoffMs: 1000 };
      default:
        return { retryable: false };
    }
  }
}
