export interface LoggerWriters {
  debug?: (...args: unknown[]) => void;
  info?: (...args: unknown[]) => void;
  error?: (...args: unknown[]) => void;
}

export interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

const defaultWriters: Required<LoggerWriters> = {
  debug: (...args) => console.debug(...args),
  info: (...args) => console.log(...args),
  error: (...args) => console.error(...args),
};

/**
 * Room and game diagnostics are useful locally, while startup and failures
 * remain visible in production for operational troubleshooting.
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
    info: (...args) => output.info(...args),
    error: (...args) => output.error(...args),
  };
}

export const logger = createLogger(process.env.NODE_ENV);
