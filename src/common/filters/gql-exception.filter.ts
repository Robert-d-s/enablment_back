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

@Catch() // Catch all exceptions initially
export class GlobalGqlExceptionFilter implements GqlExceptionFilter {
  constructor(private readonly logger: PinoLogger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const gqlHost = GqlArgumentsHost.create(host);
    const context = gqlHost.getContext(); // Contains req, res if needed
    const info = gqlHost.getInfo(); // Contains GraphQL query info

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_SERVER_ERROR';
    let extensions: Record<string, any> = {}; // For additional details

    // --- Specific Exception Handling ---

    // 1. Handle NestJS HttpException (includes BadRequestException from ValidationPipe)
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();
      if (typeof response === 'string') {
        message = response;
      } else if (typeof response === 'object' && response !== null) {
        // For ValidationPipe errors, response might be { statusCode, message[], error }
        message =
          (Array.isArray((response as any).message)
            ? (response as any).message.join(', ')
            : (response as any).message) || exception.message;
        // Extract code if available (e.g., from AuthGuard)
        if ((response as any).code) {
          code = (response as any).code;
        } else if (status === HttpStatus.UNAUTHORIZED) {
          code = 'UNAUTHENTICATED'; // Standard GraphQL error code
        } else if (status === HttpStatus.FORBIDDEN) {
          code = 'FORBIDDEN';
        } else if (status === HttpStatus.BAD_REQUEST) {
          code = 'BAD_USER_INPUT'; // Standard GraphQL error code
          // Include validation errors if present from ValidationPipe
          if (Array.isArray((response as any).message)) {
            extensions.validationErrors = (response as any).message;
          }
        }
        // Include original status code
        extensions.httpStatus = status;
      } else {
        message = exception.message;
      }
    }
    // 2. Handle Prisma Known Request Errors (e.g., unique constraints, not found)
    else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      code = exception.code; // Use Prisma error code
      extensions.prismaCode = exception.code; // Keep original code too
      extensions.prismaMeta = exception.meta; // Include metadata if available

      switch (exception.code) {
        case 'P2002': // Unique constraint failed
          status = HttpStatus.CONFLICT; // Or BAD_REQUEST
          message = `Unique constraint violation on field(s): ${exception.meta?.target?.toString() ?? 'unknown'}`;
          code = 'CONFLICT'; // Or BAD_USER_INPUT
          break;
        case 'P2014': // Required relation violation
        case 'P2011': // Null constraint violation
          status = HttpStatus.BAD_REQUEST;
          message = `Invalid input data: A required field or relation is missing.`;
          code = 'BAD_USER_INPUT';
          break;
        case 'P2025': // Record to update/delete does not exist
          status = HttpStatus.NOT_FOUND;
          message = exception.meta?.cause?.toString() ?? 'Resource not found';
          code = 'NOT_FOUND';
          break;
        case 'P2028': // Transaction API error (like timeout)
          status = HttpStatus.INTERNAL_SERVER_ERROR;
          message = 'Database operation timed out or failed.';
          code = 'TRANSACTION_TIMEOUT'; // Custom code
          break;
        // Add more specific Prisma error codes as needed
        default:
          status = HttpStatus.INTERNAL_SERVER_ERROR; // Default for unhandled Prisma errors
          message = 'A database error occurred.';
          code = 'DATABASE_ERROR'; // Custom code
      }
    }
    // 3. Handle Generic Errors
    else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(
        { err: exception, stack: exception.stack },
        'Unhandled Error in GQL Filter',
      );
    }

    // --- Construct and Return GraphQL Error ---
    // Use the standard GraphQLError class
    const graphqlError = new GraphQLError(message, {
      nodes: info.fieldNodes, // Optional: attach AST nodes
      source: undefined, // Optional: attach source
      positions: undefined, // Optional: attach positions
      path: info.path, // Optional: attach path
      originalError: exception instanceof Error ? exception : undefined, // Keep original error reference if it was an Error
      extensions: {
        code: code, // Standard or custom error code
        ...extensions, // Include httpStatus, validationErrors, prismaCode, etc.
      },
    });

    // Server-side logging (using console here, replace with injected PinoLogger if added)
    // Avoid logging sensitive details from the original exception here unless needed for debugging
    this.logger.error(
      {
        exception:
          exception instanceof Error
            ? exception.constructor.name
            : typeof exception,
        code,
        message,
        path: info?.path?.key,
        extensions,
        stack:
          exception instanceof Error && !(exception instanceof HttpException)
            ? exception.stack
            : undefined,
      },
      '[GqlExceptionFilter] Caught Exception',
    );

    return graphqlError;
  }
}
