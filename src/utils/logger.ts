
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogContext {
  requestId?: string;
  appointmentId?: string;
  insuredId?: string;
  [key: string]: any;
}

interface LogMessage {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  [key: string]: any;
}

export class Logger {
  private context: LogContext;

  constructor(context: LogContext = {}) {
    this.context = context;
  }

  public withContext(additionalContext: LogContext): Logger {
    return new Logger({ ...this.context, ...additionalContext });
  }

  public debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  public info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  public warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  public error(message: string, error?: Error | any, data?: any): void {
    const errorData = error instanceof Error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        }
      : error;

    this.log(LogLevel.ERROR, message, {
      ...data,
      error: errorData,
    });
  }

  private log(level: LogLevel, message: string, data?: any): void {
    const logMessage: LogMessage = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...(Object.keys(this.context).length > 0 && { context: this.context }),
      ...data,
    };

    const logMethod = level === LogLevel.ERROR ? console.error : console.log;
    logMethod(JSON.stringify(logMessage));
  }
}

export function createRequestLogger(requestId: string, additionalContext?: LogContext): Logger {
  return new Logger({
    requestId,
    ...additionalContext,
  });
}

export function createEventLogger(eventType: string, additionalContext?: LogContext): Logger {
  return new Logger({
    eventType,
    ...additionalContext,
  });
}
