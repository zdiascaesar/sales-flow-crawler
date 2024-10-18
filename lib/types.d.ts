import { createClient } from '@supabase/supabase-js';

export interface CrawlerConfig {
  startUrl: string;
  maxPages: number;
  concurrency: number;
  ignoreList: string[];
  normalizeEmails: boolean;
  timeout: number;
  recrawlAfterDays: number;
  maxRetries: number;
}

export interface PageInfo extends Record<string, unknown> {
  url: string;
  page_title: string;
  page_description: string;
  page_body: string;
  emails: string[];
  crawl_date: string;
}

export type ProgressCallback = (currentPage: number, totalPages: number) => void;
export type ResultCallback = (result: PageInfo) => void;
export type LogCallback = (message: string) => void;

export type EventType = 'progress' | 'result' | 'log';
export type EventCallback = {
  progress: ProgressCallback;
  result: ResultCallback;
  log: LogCallback;
};

export type SupabaseClient = ReturnType<typeof createClient>;
