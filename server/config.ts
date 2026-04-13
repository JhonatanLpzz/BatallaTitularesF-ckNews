/**
 * @fileoverview Configuración centralizada del servidor con variables de entorno.
 *
 * Valores por defecto razonables para desarrollo local. En producción se espera
 * que las variables críticas (`JWT_SECRET`) estén definidas en el entorno.
 * Incluye validación automática para producción.
 *
 * @module server/config
 */

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3001') || 3001,
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Security
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production-immediately',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  
  // Database - use local path in development, Railway volume in production
  dbPath: process.env.DB_PATH || (process.env.NODE_ENV === 'production' ? '/storage/data/batalla.db' : './data/batalla.db'),
  dbBackupPath: process.env.DB_BACKUP_PATH || (process.env.NODE_ENV === 'production' ? '/storage/data/backups' : './data/backups'),
  
  // Rate limiting (anti-spam)
  rateLimitVotes: parseInt(process.env.RATE_LIMIT_VOTES || '10'),
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '300000'), // 5 minutes
  rateLimitAdmin: parseInt(process.env.RATE_LIMIT_ADMIN || '100'),
  
  // Sessions
  sessionDuration: parseInt(process.env.SESSION_DURATION || '86400000'), // 24 hours
  sessionCleanupInterval: parseInt(process.env.SESSION_CLEANUP_INTERVAL || '3600000'), // 1 hour
  
  // Voting
  maxVotersPerBattle: parseInt(process.env.MAX_VOTERS_PER_BATTLE || '1000'),
  voteTimeoutMs: parseInt(process.env.VOTE_TIMEOUT_MS || '30000'),
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // Features
  enableAnalytics: process.env.ENABLE_ANALYTICS === 'true',
  enableVoteExport: process.env.ENABLE_VOTE_EXPORT === 'true',
} as const;

// Validation for production
if (config.nodeEnv === 'production') {
  if (config.jwtSecret === 'dev-secret-change-in-production-immediately') {
    throw new Error('JWT_SECRET must be set in production!');
  }
  
  if (config.jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters in production!');
  }
}

export default config;
