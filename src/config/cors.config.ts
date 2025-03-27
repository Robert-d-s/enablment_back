/**
 * Centralized CORS configuration for both HTTP and WebSocket connections
 */
export const getCorsConfig = () => {
  // Get frontend URL from environment variables or use a default for local development
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  // For production, use the configured frontend URL
  // For development, allow multiple local origins
  const origins =
    process.env.NODE_ENV === 'production'
      ? frontendUrl
      : [
          'http://localhost:3000',
          'http://localhost:4000',
          'http://127.0.0.1:3000',
        ];

  return {
    origin: origins,
    credentials: true,
  };
};
