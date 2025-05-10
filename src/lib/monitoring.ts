/**
 * Application monitoring and logging utilities
 */

// Define log levels
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

// Configuration for logging
const LOG_CONFIG = {
  minLevel: process.env.LOG_LEVEL || 'info',
  enableConsole: process.env.NODE_ENV !== 'production',
  enableRemote: process.env.NODE_ENV === 'production',
  sampleRate: 0.1, // Sample 10% of logs in production
};

// Map of log levels to numeric values for comparison
const LOG_LEVEL_VALUES: Record<LogLevel, number> = {
  [LogLevel.ERROR]: 0,
  [LogLevel.WARN]: 1,
  [LogLevel.INFO]: 2,
  [LogLevel.DEBUG]: 3,
};

/**
 * Checks if a log should be recorded based on its level
 */
function shouldLog(level: LogLevel): boolean {
  const configLevel = LOG_CONFIG.minLevel as LogLevel;
  return LOG_LEVEL_VALUES[level] <= LOG_LEVEL_VALUES[configLevel];
}

/**
 * Determines if a log should be sampled (for high-volume logs in production)
 */
function shouldSample(): boolean {
  if (process.env.NODE_ENV !== 'production') return true;
  return Math.random() < LOG_CONFIG.sampleRate;
}

/**
 * Send logs to remote logging service (Vercel Logs, etc.)
 */
async function sendToRemoteLogging(
  level: LogLevel,
  message: string,
  meta: Record<string, any>
): Promise<void> {
  if (!LOG_CONFIG.enableRemote) return;
  
  try {
    // In a real implementation, this would send to a logging service
    // For example, using the Vercel Logging API
    const response = await fetch(process.env.LOGGING_ENDPOINT || '', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level,
        message,
        timestamp: new Date().toISOString(),
        ...meta,
      }),
    });
    
    if (!response.ok) {
      // Don't try to log this failure to avoid infinite loops
      console.error('Failed to send log to remote service', response.status);
    }
  } catch (error) {
    // Similarly, just log locally
    console.error('Error sending log to remote service', error);
  }
}

/**
 * Main logging function
 */
export function logger(
  level: LogLevel,
  message: string,
  meta: Record<string, any> = {}
): void {
  // Skip if below minimum log level
  if (!shouldLog(level)) return;
  
  // Add standard metadata
  const logMeta = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    ...meta,
  };
  
  // Log to console in development
  if (LOG_CONFIG.enableConsole) {
    const consoleMethod = level === LogLevel.ERROR ? 'error' 
      : level === LogLevel.WARN ? 'warn' 
      : 'log';
    
    console[consoleMethod](`[${level.toUpperCase()}] ${message}`, logMeta);
  }
  
  // Send to remote logging in production (with sampling)
  if (LOG_CONFIG.enableRemote && shouldSample()) {
    sendToRemoteLogging(level, message, logMeta);
  }
}

// Convenience methods
export const log = {
  error: (message: string, meta?: Record<string, any>) => 
    logger(LogLevel.ERROR, message, meta),
  warn: (message: string, meta?: Record<string, any>) => 
    logger(LogLevel.WARN, message, meta),
  info: (message: string, meta?: Record<string, any>) => 
    logger(LogLevel.INFO, message, meta),
  debug: (message: string, meta?: Record<string, any>) => 
    logger(LogLevel.DEBUG, message, meta),
};

/**
 * Track performance metrics
 */
export class PerformanceTracker {
  private startTime: number;
  private name: string;
  private meta: Record<string, any>;
  
  constructor(name: string, meta: Record<string, any> = {}) {
    this.name = name;
    this.meta = meta;
    this.startTime = performance.now();
  }
  
  /**
   * End tracking and log the duration
   */
  end(additionalMeta: Record<string, any> = {}): number {
    const duration = performance.now() - this.startTime;
    
    log.info(`Performance: ${this.name}`, {
      operationName: this.name,
      durationMs: Math.round(duration),
      ...this.meta,
      ...additionalMeta,
    });
    
    return duration;
  }
}

/**
 * Track API request performance
 */
export function trackApiRequest(req: Request, name: string): PerformanceTracker {
  return new PerformanceTracker(name, {
    path: new URL(req.url).pathname,
    method: req.method,
  });
}

/**
 * Record an error with additional context
 */
export function recordError(error: Error, context: Record<string, any> = {}): void {
  log.error(error.message, {
    errorName: error.name,
    stack: error.stack,
    ...context,
  });
} 