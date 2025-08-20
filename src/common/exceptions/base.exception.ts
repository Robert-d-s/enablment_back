import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Base interface for structured error responses
 */
export interface StructuredErrorResponse {
  message: string;
  error: string;
  statusCode: number;
  context?: Record<string, unknown>;
  timestamp?: string;
  path?: string;
}

/**
 * Base class for all application exceptions with consistent structure
 */
export abstract class BaseAppException extends HttpException {
  public readonly errorCode: string;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    errorCode: string,
    statusCode: HttpStatus,
    context?: Record<string, unknown>,
  ) {
    const response: StructuredErrorResponse = {
      message,
      error: errorCode,
      statusCode,
      context,
      timestamp: new Date().toISOString(),
    };

    super(response, statusCode);
    this.errorCode = errorCode;
    this.context = context;
  }
}

/**
 * Domain-specific exception classes
 */

// Authentication & Authorization
export class AuthenticationException extends BaseAppException {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'AUTHENTICATION_FAILED', HttpStatus.UNAUTHORIZED, context);
  }
}

export class AuthorizationException extends BaseAppException {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'AUTHORIZATION_FAILED', HttpStatus.FORBIDDEN, context);
  }
}

export class TokenException extends BaseAppException {
  constructor(
    message: string,
    type: 'INVALID' | 'EXPIRED' | 'BLACKLISTED',
    context?: Record<string, unknown>,
  ) {
    super(message, `TOKEN_${type}`, HttpStatus.UNAUTHORIZED, context);
  }
}

// Validation
export class ValidationException extends BaseAppException {
  constructor(field: string, value: unknown, reason: string) {
    super(
      `Validation failed for field '${field}': ${reason}`,
      'VALIDATION_ERROR',
      HttpStatus.BAD_REQUEST,
      { field, value, reason },
    );
  }
}

// Resource Management
export class ResourceNotFoundException extends BaseAppException {
  constructor(
    resourceType: string,
    resourceId: string | number,
    context?: string,
  ) {
    const message = context
      ? `${resourceType} with ID ${resourceId} not found in context: ${context}`
      : `${resourceType} with ID ${resourceId} not found`;

    super(
      message,
      `${resourceType.toUpperCase()}_NOT_FOUND`,
      HttpStatus.NOT_FOUND,
      {
        resourceType,
        resourceId,
        context,
      },
    );
  }
}

export class ResourceConflictException extends BaseAppException {
  constructor(
    resourceType: string,
    conflictReason: string,
    context?: Record<string, unknown>,
  ) {
    super(
      `${resourceType} conflict: ${conflictReason}`,
      `${resourceType.toUpperCase()}_CONFLICT`,
      HttpStatus.CONFLICT,
      context,
    );
  }
}

// Business Logic
export class BusinessLogicException extends BaseAppException {
  constructor(
    operation: string,
    reason: string,
    context?: Record<string, unknown>,
  ) {
    super(
      `Business rule violation in ${operation}: ${reason}`,
      'BUSINESS_LOGIC_ERROR',
      HttpStatus.BAD_REQUEST,
      { operation, reason, ...context },
    );
  }
}

// External Services
export class ExternalServiceException extends BaseAppException {
  constructor(
    serviceName: string,
    operation: string,
    originalError?: Error,
    context?: Record<string, unknown>,
  ) {
    super(
      `External service ${serviceName} failed during ${operation}`,
      'EXTERNAL_SERVICE_ERROR',
      HttpStatus.BAD_GATEWAY,
      {
        serviceName,
        operation,
        originalError: originalError?.message,
        ...context,
      },
    );
  }
}

// Database Operations
export class DatabaseException extends BaseAppException {
  constructor(
    operation: string,
    table?: string,
    originalError?: Error,
    context?: Record<string, unknown>,
  ) {
    const message = table
      ? `Database operation failed: ${operation} on ${table}`
      : `Database operation failed: ${operation}`;

    super(message, 'DATABASE_ERROR', HttpStatus.INTERNAL_SERVER_ERROR, {
      operation,
      table,
      originalError: originalError?.message,
      ...context,
    });
  }
}

// WebSocket Specific
export class WebSocketException extends BaseAppException {
  constructor(
    reason: string,
    code: 'CONNECTION_FAILED' | 'AUTH_REQUIRED' | 'INVALID_MESSAGE',
    context?: Record<string, unknown>,
  ) {
    super(
      `WebSocket error: ${reason}`,
      `WEBSOCKET_${code}`,
      HttpStatus.BAD_REQUEST,
      context,
    );
  }
}

/**
 * Factory functions for common exceptions to maintain consistency
 */
export class ExceptionFactory {
  static userNotFound(
    userId: number,
    context?: string,
  ): ResourceNotFoundException {
    return new ResourceNotFoundException('User', userId, context);
  }

  static teamNotFound(
    teamId: string,
    context?: string,
  ): ResourceNotFoundException {
    return new ResourceNotFoundException('Team', teamId, context);
  }

  static projectNotFound(
    projectId: string,
    context?: string,
  ): ResourceNotFoundException {
    return new ResourceNotFoundException('Project', projectId, context);
  }

  static issueNotFound(
    issueId: string,
    context?: string,
  ): ResourceNotFoundException {
    return new ResourceNotFoundException('Issue', issueId, context);
  }

  static invalidCredentials(): AuthenticationException {
    return new AuthenticationException('Invalid email or password');
  }

  static tokenExpired(): TokenException {
    return new TokenException('Access token has expired', 'EXPIRED');
  }

  static tokenBlacklisted(): TokenException {
    return new TokenException('Token has been revoked', 'BLACKLISTED');
  }

  static insufficientPermissions(
    operation: string,
    resource?: string,
  ): AuthorizationException {
    const message = resource
      ? `Insufficient permissions to ${operation} on ${resource}`
      : `Insufficient permissions to ${operation}`;
    return new AuthorizationException(message, { operation, resource });
  }

  static validationError(
    field: string,
    value: unknown,
    reason: string,
  ): ValidationException {
    return new ValidationException(field, value, reason);
  }

  static businessLogicError(
    operation: string,
    reason: string,
    context?: Record<string, unknown>,
  ): BusinessLogicException {
    return new BusinessLogicException(operation, reason, context);
  }

  static databaseError(
    operation: string,
    table?: string,
    originalError?: Error,
  ): DatabaseException {
    return new DatabaseException(operation, table, originalError);
  }

  static webSocketAuthRequired(): WebSocketException {
    return new WebSocketException(
      'Authentication required for WebSocket connection',
      'AUTH_REQUIRED',
    );
  }

  static webSocketInvalidMessage(reason: string): WebSocketException {
    return new WebSocketException(reason, 'INVALID_MESSAGE');
  }
}
