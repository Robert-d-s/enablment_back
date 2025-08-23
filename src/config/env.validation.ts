import { Logger } from '@nestjs/common';

/**
 * Required environment variables for the application to function properly
 */
const REQUIRED_ENV_VARS = [
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'DATABASE_URL',
  'WEBHOOK_SECRET',
] as const;

/**
 * Optional environment variables with their default values
 */
const OPTIONAL_ENV_VARS = {
  NODE_ENV: 'development',
  PORT: '8080',
  LOG_LEVEL: 'info',
  JWT_ACCESS_EXPIRATION: '15m',
  JWT_REFRESH_EXPIRATION: '7d',
  THROTTLE_LIMIT: '100',
  AUTH_THROTTLE_LIMIT: '10',
  CORS_ORIGINS: 'http://localhost:3000,http://localhost:3001,http://localhost:4000',
} as const;

/**
 * Validates that all required environment variables are present and not empty
 * @throws Error if any required environment variable is missing or empty
 */
export function validateEnvironment(): void {
  const logger = new Logger('EnvironmentValidator');
  const missingVars: string[] = [];
  const emptyVars: string[] = [];

  logger.log('Validating environment variables...');

  // Check required variables
  for (const varName of REQUIRED_ENV_VARS) {
    const value = process.env[varName];
    
    if (!value) {
      missingVars.push(varName);
    } else if (value.trim() === '') {
      emptyVars.push(varName);
    }
  }

  // Log warnings for missing optional variables and set defaults
  for (const [varName, defaultValue] of Object.entries(OPTIONAL_ENV_VARS)) {
    if (!process.env[varName]) {
      process.env[varName] = defaultValue;
      logger.warn(`${varName} not set, using default: ${defaultValue}`);
    }
  }

  // Validate JWT secrets are sufficiently strong
  const jwtAccessSecret = process.env.JWT_ACCESS_SECRET;
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
  const webhookSecret = process.env.WEBHOOK_SECRET;

  if (jwtAccessSecret && jwtAccessSecret.length < 32) {
    logger.error('JWT_ACCESS_SECRET should be at least 32 characters long for security');
    missingVars.push('JWT_ACCESS_SECRET (too short)');
  }

  if (jwtRefreshSecret && jwtRefreshSecret.length < 32) {
    logger.error('JWT_REFRESH_SECRET should be at least 32 characters long for security');
    missingVars.push('JWT_REFRESH_SECRET (too short)');
  }

  if (webhookSecret && webhookSecret.length < 16) {
    logger.error('WEBHOOK_SECRET should be at least 16 characters long for security');
    missingVars.push('WEBHOOK_SECRET (too short)');
  }

  // Validate DATABASE_URL format
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl && !databaseUrl.startsWith('mysql://') && !databaseUrl.startsWith('postgresql://')) {
    logger.error('DATABASE_URL should start with mysql:// or postgresql://');
    missingVars.push('DATABASE_URL (invalid format)');
  }

  // Validate numeric environment variables
  const throttleLimit = process.env.THROTTLE_LIMIT;
  const authThrottleLimit = process.env.AUTH_THROTTLE_LIMIT;
  const port = process.env.PORT;

  if (throttleLimit && isNaN(Number(throttleLimit))) {
    logger.error('THROTTLE_LIMIT must be a valid number');
    missingVars.push('THROTTLE_LIMIT (not a number)');
  }

  if (authThrottleLimit && isNaN(Number(authThrottleLimit))) {
    logger.error('AUTH_THROTTLE_LIMIT must be a valid number');
    missingVars.push('AUTH_THROTTLE_LIMIT (not a number)');
  }

  if (port && isNaN(Number(port))) {
    logger.error('PORT must be a valid number');
    missingVars.push('PORT (not a number)');
  }

  // Report results
  if (missingVars.length > 0 || emptyVars.length > 0) {
    const errorMessage = [
      'Environment validation failed:',
      ...(missingVars.length > 0 ? [`Missing variables: ${missingVars.join(', ')}`] : []),
      ...(emptyVars.length > 0 ? [`Empty variables: ${emptyVars.join(', ')}`] : []),
      '',
      'Please check your .env file or environment configuration.',
      'Refer to .env.example for required variables.',
    ].join('\n');

    logger.error(errorMessage);
    throw new Error(errorMessage);
  }

  logger.log('✅ Environment validation passed');
}

/**
 * Logs the current environment configuration (without sensitive values)
 */
export function logEnvironmentInfo(): void {
  const logger = new Logger('EnvironmentInfo');
  
  logger.log(`Environment: ${process.env.NODE_ENV}`);
  logger.log(`Port: ${process.env.PORT}`);
  logger.log(`Log Level: ${process.env.LOG_LEVEL}`);
  logger.log(`JWT Access Token TTL: ${process.env.JWT_ACCESS_EXPIRATION}`);
  logger.log(`JWT Refresh Token TTL: ${process.env.JWT_REFRESH_EXPIRATION}`);
  logger.log(`Rate Limiting: ${process.env.THROTTLE_LIMIT} requests/minute`);
  logger.log(`Auth Rate Limiting: ${process.env.AUTH_THROTTLE_LIMIT} attempts/5min`);
  logger.log(`CORS Origins: ${process.env.CORS_ORIGINS?.split(',').length} configured`);
  
  // Mask sensitive values
  const maskedDbUrl = process.env.DATABASE_URL?.replace(/:([^:@]+)@/, ':***@') || 'Not set';
  logger.log(`Database URL: ${maskedDbUrl.substring(0, 50)}...`);
  
  logger.log(`JWT secrets configured: ${!!process.env.JWT_ACCESS_SECRET && !!process.env.JWT_REFRESH_SECRET ? '✅' : '❌'}`);
  logger.log(`Webhook secret configured: ${!!process.env.WEBHOOK_SECRET ? '✅' : '❌'}`);
}