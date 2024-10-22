import * as fs from 'fs';
import { CrawlerConfig } from './types';

function log(message: string) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp}: ${message}\n`;
  fs.appendFileSync('config_log.txt', logMessage);
}

export function loadConfig(configPath: string): CrawlerConfig {
  try {
    const configFile = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configFile);
    return {
      ...config,
      recrawlAfterDays: config.recrawlAfterDays || 30,
      maxRetries: config.maxRetries || 3
    };
  } catch (error) {
    log(`Error loading configuration: ${(error as Error).message}`);
    throw error;
  }
}
