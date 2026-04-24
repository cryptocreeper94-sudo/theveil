type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

const currentLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || "info";

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function formatLog(level: LogLevel, module: string, message: string, meta?: Record<string, any>): string {
  const entry: Record<string, any> = {
    timestamp: new Date().toISOString(),
    level: level.toUpperCase(),
    module,
    message,
  };
  if (meta && Object.keys(meta).length > 0) {
    Object.assign(entry, meta);
  }
  return JSON.stringify(entry);
}

function createLogger(module: string) {
  return {
    debug(message: string, meta?: Record<string, any>) {
      if (shouldLog("debug")) console.debug(formatLog("debug", module, message, meta));
    },
    info(message: string, meta?: Record<string, any>) {
      if (shouldLog("info")) console.log(formatLog("info", module, message, meta));
    },
    warn(message: string, meta?: Record<string, any>) {
      if (shouldLog("warn")) console.warn(formatLog("warn", module, message, meta));
    },
    error(message: string, meta?: Record<string, any>) {
      if (shouldLog("error")) console.error(formatLog("error", module, message, meta));
    },
    fatal(message: string, meta?: Record<string, any>) {
      if (shouldLog("fatal")) console.error(formatLog("fatal", module, message, meta));
    },
  };
}

export { createLogger, LogLevel };
export const logger = createLogger("app");
