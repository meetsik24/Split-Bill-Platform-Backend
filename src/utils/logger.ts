import { env } from '../config/env';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

export interface LogContext {
  service?: string;
  operation?: string;
  userId?: string;
  requestId?: string;
  [key: string]: any;
}

class Logger {
  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = this.getTimestamp();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = Object.values(LogLevel);
    const currentLevelIndex = levels.indexOf(level);
    const configLevelIndex = levels.indexOf(env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO);
    
    return currentLevelIndex <= configLevelIndex;
  }

  error(message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    
    const logMessage = this.formatMessage(LogLevel.ERROR, message, context);
    console.error(logMessage);
    
    if (error) {
      console.error('Error details:', error);
    }
  }

  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    
    const logMessage = this.formatMessage(LogLevel.WARN, message, context);
    console.warn(logMessage);
  }

  info(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    const logMessage = this.formatMessage(LogLevel.INFO, message, context);
    console.info(logMessage);
  }

  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    
    const logMessage = this.formatMessage(LogLevel.DEBUG, message, context);
    console.debug(logMessage);
  }

  // Specialized logging methods
  logUSSDRequest(sessionId: string, phoneNumber: string, text: string): void {
    this.info('USSD Request received', {
      service: 'USSD',
      operation: 'request',
      sessionId,
      phoneNumber,
      text: text || '(empty)',
    });
  }

  logUSSDResponse(sessionId: string, status: string, message: string): void {
    this.info('USSD Response sent', {
      service: 'USSD',
      operation: 'response',
      sessionId,
      status,
      messageLength: message.length,
    });
  }

  logSMSSent(to: string, messageId: string, success: boolean): void {
    this.info('SMS operation completed', {
      service: 'SMS',
      operation: 'send',
      to,
      messageId,
      success,
    });
  }

  logPaymentProcessed(billId: number, memberPhone: string, success: boolean): void {
    this.info('Payment processed', {
      service: 'Payment',
      operation: 'process',
      billId,
      memberPhone,
      success,
    });
  }

  logBillCreated(billId: number, creatorPhone: string, amount: number, memberCount: number): void {
    this.info('Bill created', {
      service: 'Bill',
      operation: 'create',
      billId,
      creatorPhone,
      amount,
      memberCount,
    });
  }

  logDatabaseOperation(operation: string, table: string, success: boolean, duration?: number): void {
    this.info('Database operation completed', {
      service: 'Database',
      operation,
      table,
      success,
      duration: duration ? `${duration}ms` : undefined,
    });
  }

  logError(error: Error, context?: LogContext): void {
    this.error('An error occurred', context, error);
  }

  // Performance logging
  logPerformance(operation: string, duration: number, context?: LogContext): void {
    if (duration > 1000) { // Log slow operations (>1s)
      this.warn('Slow operation detected', {
        ...context,
        operation,
        duration: `${duration}ms`,
      });
    } else {
      this.debug('Operation completed', {
        ...context,
        operation,
        duration: `${duration}ms`,
      });
    }
  }
}

export const logger = new Logger();
