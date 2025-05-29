import {
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { GqlExceptionFilter, GqlArgumentsHost } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';
import { GraphQLError } from 'graphql';
import { LoggingService } from '../services/logging.service';

@Catch()
export class GlobalGqlExceptionFilter implements GqlExceptionFilter {
  constructor(private readonly loggingService: LoggingService) {}

  catch(exception: unknown, host: ArgumentsHost): GraphQLError {
    const gqlHost = GqlArgumentsHost.create(host);
    const info = gqlHost.getInfo(); // Log the error for debugging
    this.loggingService.logError('GraphQL error occurred', exception as Error, {
      operation: info?.operation?.name?.value,
      error: this.serializeError(exception),
    });

    // Handle specific error types
    if (exception instanceof HttpException) {
      return this.handleHttpException(exception);
    }

    if (this.isPrismaError(exception)) {
      return this.handlePrismaError(
        exception as Prisma.PrismaClientKnownRequestError,
      );
    }

    if (exception instanceof GraphQLError) {
      return exception;
    }

    // Default error handling
    return new GraphQLError('Internal server error', {
      extensions: {
        code: 'INTERNAL_SERVER_ERROR',
      },
    });
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

  private serializeError(error: unknown): any {
    if (error instanceof Error) {
      const { name, message, stack } = error;
      return { name, message, stack };
    }
    return error;
  }
}
