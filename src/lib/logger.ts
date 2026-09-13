export interface LoggerWriters {
  debug?: (...args: unknown[]) => void;
  warn?: (...args: unknown[]) => void;
  error?: (...args: unknown[]) => void;
}

export interface Logger {
  debug: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

const defaultWriters: Required<LoggerWriters> = {
  debug: (...args) => console.debug(...args),
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
};

/**
 * Client diagnostics are available during development only. Errors remain
 * visible in production so connection and server failures can be diagnosed.
 */
export function createLogger(
  environment: string | undefined,
  writers: LoggerWriters = {},
): Logger {
  const debugEnabled = environment !== 'production';
  const output = { ...defaultWriters, ...writers };

  return {
    debug: (...args) => {
      if (debugEnabled) output.debug(...args);
    },
    warn: (...args) => {
      if (debugEnabled) output.warn(...args);
    },
    error: (...args) => output.error(...args),
  };
}

export const logger = createLogger(process.env.NODE_ENV);
