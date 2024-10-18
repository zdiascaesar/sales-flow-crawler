import * as fs from 'fs';
import { CrawlerConfig } from './types';

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
    console.error(`Error loading configuration: ${(error as Error).message}`);
    throw error;
  }
}
