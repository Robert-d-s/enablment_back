import {
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { GqlExceptionFilter, GqlArgumentsHost } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';
import { GraphQLError } from 'graphql';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import {
  BaseAppException,
  StructuredErrorResponse,
} from '../exceptions/base.exception';

@Catch()
export class GlobalGqlExceptionFilter implements GqlExceptionFilter {
  constructor(
    @InjectPinoLogger(GlobalGqlExceptionFilter.name)
    private readonly logger: PinoLogger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): GraphQLError {
    const gqlHost = GqlArgumentsHost.create(host);
    const info = gqlHost.getInfo();

    // Enhanced logging with operation context
    this.logger.error(
      {
        operation: info?.operation?.name?.value,
        fieldName: info?.fieldName,
        error: this.serializeError(exception),
        path: info?.path,
      },
      'GraphQL error occurred',
    );

    // Handle standardized application exceptions first
    if (exception instanceof BaseAppException) {
      return this.handleStandardizedException(exception);
    }

    // Handle legacy HTTP exceptions
    if (exception instanceof HttpException) {
      return this.handleHttpException(exception);
    }

    // Handle Prisma database errors
    if (this.isPrismaError(exception)) {
      return this.handlePrismaError(
        exception as Prisma.PrismaClientKnownRequestError,
      );
    }

    // Handle GraphQL errors
    if (exception instanceof GraphQLError) {
      return exception;
    }

    // Default error handling with sanitized response
    this.logger.error({ err: exception }, 'Unhandled exception in GraphQL');
    return new GraphQLError(
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : `Unhandled error: ${String(exception)}`,
      {
        extensions: {
          code: 'INTERNAL_SERVER_ERROR',
          timestamp: new Date().toISOString(),
        },
      },
    );
  }

  private handleHttpException(exception: HttpException): GraphQLError {
    const status = exception.getStatus();
    const response = exception.getResponse();

    let message = exception.message;
    let code = 'BAD_REQUEST';

    // Extract message from response if it's an object
    if (typeof response === 'object' && response !== null) {
      const responseObj = response as any;
      message = Array.isArray(responseObj.message)
        ? responseObj.message.join(', ')
        : responseObj.message || message;
    }

    // Map common HTTP status codes to GraphQL error codes
    switch (status) {
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
      default:
        code = 'BAD_USER_INPUT';
    }

    return new GraphQLError(message, {
      extensions: { code },
    });
  }

  private handlePrismaError(
    exception: Prisma.PrismaClientKnownRequestError,
  ): GraphQLError {
    let message = 'Database operation failed';
    let code = 'DATABASE_ERROR';

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
      default:
        message = 'An unexpected database error occurred';
    }

    return new GraphQLError(message, {
      extensions: { code },
    });
  }

  private isPrismaError(exception: unknown): boolean {
    return (
      exception instanceof Prisma.PrismaClientKnownRequestError ||
      exception instanceof Prisma.PrismaClientUnknownRequestError ||
      exception instanceof Prisma.PrismaClientRustPanicError ||
      exception instanceof Prisma.PrismaClientInitializationError ||
      exception instanceof Prisma.PrismaClientValidationError
    );
  }

  private handleStandardizedException(
    exception: BaseAppException,
  ): GraphQLError {
    const response = exception.getResponse() as StructuredErrorResponse;

    return new GraphQLError(response.message, {
      extensions: {
        code: response.error,
        statusCode: response.statusCode,
        context: response.context,
        timestamp: response.timestamp,
      },
    });
  }

  private serializeError(error: unknown): any {
    if (error instanceof BaseAppException) {
      return {
        name: error.name,
        message: error.message,
        errorCode: error.errorCode,
        context: error.context,
        // Only include stack trace in development
        ...(process.env.NODE_ENV !== 'production' && { stack: error.stack }),
      };
    }

    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        // Only include stack trace in development
        ...(process.env.NODE_ENV !== 'production' && { stack: error.stack }),
      };
    }

    return error;
  }
}
