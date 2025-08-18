// Export all exception classes for easy importing
export * from './base.exception';

// Re-export NestJS exceptions for consistency
export {
  HttpException,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  InternalServerErrorException,
  BadGatewayException,
  ServiceUnavailableException,
} from '@nestjs/common';
