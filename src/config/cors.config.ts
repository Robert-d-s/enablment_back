import { ConfigService } from '@nestjs/config';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

export const getCorsConfig = (configService: ConfigService): CorsOptions => {
  // Get allowed origins from environment variable, fallback to localhost for development
  const allowedOrigins = configService.get<string>('CORS_ORIGINS');

  const defaultOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:4000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
  ];

  const origins = allowedOrigins
    ? allowedOrigins.split(',').map((origin) => origin.trim())
    : defaultOrigins;

  return {
    origin: origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Cookie',
      'X-Requested-With',
      'linear-signature',
    ],
  };
};

// Simple CORS config for WebSocket gateway decorators (can't inject ConfigService)
export const getWebSocketCorsConfig = (): CorsOptions => {
  // For WebSockets, use environment variable directly or fallback to defaults
  const allowedOrigins = process.env.CORS_ORIGINS;

  const defaultOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:4000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
  ];

  const origins = allowedOrigins
    ? allowedOrigins.split(',').map((origin) => origin.trim())
    : defaultOrigins;

  return {
    origin: origins,
    credentials: true,
  };
};
