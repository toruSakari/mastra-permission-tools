export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LoggerOptions {
  level?: LogLevel;
  prefix?: string;
  timestamps?: boolean;
}

export class Logger {
  private level: LogLevel;
  private prefix: string;
  private timestamps: boolean;

  private levelValues: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor(options: LoggerOptions = {}) {
    this.level = options.level || 'info';
    this.prefix = options.prefix || '[mastra-permission-tools]';
    this.timestamps = options.timestamps ?? true;
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levelValues[level] >= this.levelValues[this.level];
  }

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    let formatted = '';

    if (this.timestamps) {
      formatted += `[${new Date().toISOString()}] `;
    }

    formatted += `${this.prefix} ${level.toUpperCase()}: ${message}`;

    if (data) {
      formatted += ` ${JSON.stringify(data)}`;
    }

    return formatted;
  }

  debug(message: string, data?: any): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, data));
    }
  }

  info(message: string, data?: any): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, data));
    }
  }

  warn(message: string, data?: any): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, data));
    }
  }

  error(message: string, error?: Error | any): void {
    if (this.shouldLog('error')) {
      const errorData = error instanceof Error ? {
        message: error.message,
        stack: error.stack,
      } : error;
      console.error(this.formatMessage('error', message, errorData));
    }
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  getLevel(): LogLevel {
    return this.level;
  }
}

// デフォルトのロガーインスタンス
export const defaultLogger = new Logger();