/**
 * Centralized CORS configuration for both HTTP and WebSocket connections
 */
export const getCorsConfig = () => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
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
