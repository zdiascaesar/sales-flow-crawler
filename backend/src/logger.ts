import fs from 'fs';

class Logger {
  private logFile: string;

  constructor(logFile: string) {
    this.logFile = logFile;
  }

  info(message: string): void {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp}: ${message}\n`;
    fs.appendFileSync(this.logFile, logMessage);
  }

  error(message: string, error?: unknown): void {
    const timestamp = new Date().toISOString();
    const errorMessage = error instanceof Error ? error.message : String(error);
    const logMessage = `${timestamp} ERROR: ${message}${error ? ` - ${errorMessage}` : ''}\n`;
    fs.appendFileSync(this.logFile, logMessage);
  }
}

export const logger = new Logger('email_log.txt');
