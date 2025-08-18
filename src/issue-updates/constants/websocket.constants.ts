export const WEBSOCKET_CONSTANTS = {
  EVENTS: {
    ISSUE_UPDATE: 'issueUpdate',
    CONNECTION_STATUS: 'connectionStatus',
    ERROR: 'error',
    HEARTBEAT: 'heartbeat',
  },
  LIMITS: {
    MAX_CONNECTIONS_PER_USER: 5,
    MAX_MESSAGE_SIZE: 1024 * 10, // 10KB
    HEARTBEAT_INTERVAL: 30000, // 30 seconds
    CONNECTION_TIMEOUT: 60000, // 1 minute
    RATE_LIMIT_WINDOW: 60000, // 1 minute
    RATE_LIMIT_MAX_MESSAGES: 100,
  },
  ERRORS: {
    INVALID_MESSAGE_FORMAT: 'Invalid message format',
    MESSAGE_TOO_LARGE: 'Message exceeds maximum size limit',
    RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
    AUTHENTICATION_FAILED: 'Authentication failed',
    UNAUTHORIZED_ACTION: 'Unauthorized action',
  },
} as const;
