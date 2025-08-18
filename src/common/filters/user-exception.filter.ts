import {
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { GqlArgumentsHost, GqlExceptionFilter } from '@nestjs/graphql';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import {
  UserNotFoundException,
  TeamNotFoundException,
  UserTeamRelationExistsException,
  UserTeamRelationNotFoundException,
  InvalidRoleChangeException,
  UserOperationFailedException,
  TeamOperationFailedException,
  UserPermissionDeniedException,
} from '../../user/exceptions/user.exceptions';

/**
 * Global exception filter for handling user-related exceptions
 * Provides consistent error responses across the application
 */
@Catch(
  UserNotFoundException,
  TeamNotFoundException,
  UserTeamRelationExistsException,
  UserTeamRelationNotFoundException,
  InvalidRoleChangeException,
  UserOperationFailedException,
  TeamOperationFailedException,
  UserPermissionDeniedException,
)
export class UserExceptionFilter implements GqlExceptionFilter {
  constructor(
    @InjectPinoLogger(UserExceptionFilter.name)
    private readonly logger: PinoLogger,
  ) {}

  catch(exception: HttpException, host: ArgumentsHost): HttpException {
    const gqlHost = GqlArgumentsHost.create(host);
    const info = gqlHost.getInfo();
    const context = gqlHost.getContext();

    // Log the exception with context
    this.logger.warn(
      {
        exception: exception.name,
        message: exception.message,
        response: exception.getResponse(),
        operation: info?.fieldName,
        userId: context?.req?.user?.id,
      },
      'User operation exception caught',
    );

    // Return the exception as-is for GraphQL
    // GraphQL will handle the HTTP status codes appropriately
    return exception;
  }
}

/**
 * Fallback exception filter for unexpected errors
 */
@Catch()
export class GlobalExceptionFilter implements GqlExceptionFilter {
  constructor(
    @InjectPinoLogger(GlobalExceptionFilter.name)
    private readonly logger: PinoLogger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): HttpException {
    const gqlHost = GqlArgumentsHost.create(host);
    const info = gqlHost.getInfo();
    const context = gqlHost.getContext();

    // Log unexpected errors
    this.logger.error(
      {
        exception: exception instanceof Error ? exception.name : 'Unknown',
        message:
          exception instanceof Error ? exception.message : 'Unknown error',
        stack: exception instanceof Error ? exception.stack : undefined,
        operation: info?.fieldName,
        userId: context?.req?.user?.id,
      },
      'Unexpected exception caught',
    );

    // Return a sanitized error response
    if (exception instanceof HttpException) {
      return exception;
    }

    // For non-HTTP exceptions, return a generic internal server error
    return new HttpException(
      {
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
