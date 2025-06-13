import { config } from '../config';

// Define log levels with numeric values for comparison
const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
} as const;

type LogLevel = keyof typeof LOG_LEVELS;

// Parse configured log level with fallback to 'info'
const currentLevel =
  (config.logLevel as LogLevel) in LOG_LEVELS ? (config.logLevel as LogLevel) : 'info';

/**
 * Utility logger that respects the configured log level
 */
export const logger = {
  debug: (message: string, ...args: any[]) => {
    if (LOG_LEVELS[currentLevel] <= LOG_LEVELS.debug) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  },

  info: (message: string, ...args: any[]) => {
    if (LOG_LEVELS[currentLevel] <= LOG_LEVELS.info) {
      console.info(`[INFO] ${message}`, ...args);
    }
  },

  warn: (message: string, ...args: any[]) => {
    if (LOG_LEVELS[currentLevel] <= LOG_LEVELS.warn) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },

  error: (message: string, ...args: any[]) => {
    if (LOG_LEVELS[currentLevel] <= LOG_LEVELS.error) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  },
};
