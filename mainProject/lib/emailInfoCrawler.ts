import { URL } from 'url';
import { CheerioAPI, load } from 'cheerio';
import { CrawlerConfig, PageInfo, SupabaseClient, EventType, EventCallback } from './types';
import { loadConfig } from './config';
import { initializeSupabaseClient } from './supabaseClient';
import { EventEmitter } from './eventEmitter';
import { extractPageInfo } from './pageInfoExtractor';
import { LinkQueue, queueLinks } from './linkQueue';
import { EmailFilter } from './emailFilter';
import { queueManager } from './queueManager';

export class EmailInfoCrawler {
  private config: CrawlerConfig;
  private startUrl: URL;
  private results: PageInfo[];
  private activeRequests: number;
  private errors: { url: string; error: string }[];
  private startTime: string;
  private crawledPages: number;
  private stopRequested: boolean;
  private running: boolean;
  private supabase: SupabaseClient;
  private eventEmitter: EventEmitter;
  private linkQueue: LinkQueue;
  private emailFilter: EmailFilter;

  constructor(configPath: string) {
    this.config = loadConfig(configPath);
    this.startUrl = new URL(this.config.startUrl);
    this.results = [];
    this.activeRequests = 0;
    this.errors = [];
    this.startTime = new Date().toISOString();
    this.crawledPages = 0;
    this.stopRequested = false;
    this.running = false;
    this.supabase = initializeSupabaseClient();
    this.eventEmitter = new EventEmitter();
    this.linkQueue = new LinkQueue(this.startUrl);
    this.emailFilter = new EmailFilter(this.supabase);

    this.eventEmitter.emit('log', 'EmailInfoCrawler initialized');
  }

  on<T extends EventType>(event: T, callback: EventCallback[T]): void {
    this.eventEmitter.on(event, callback);
  }

  async crawl(startUrl: string, maxPages?: number, concurrency?: number): Promise<PageInfo[]> {
    this.startUrl = new URL(startUrl);
    this.config.maxPages = maxPages || this.config.maxPages;
    this.config.concurrency = concurrency || this.config.concurrency;

    this.linkQueue = new LinkQueue(this.startUrl);
    this.results = [];
    this.crawledPages = 0;
    this.errors = [];
    this.startTime = new Date().toISOString();

    this.eventEmitter.emit('log', `Starting crawl from ${this.startUrl}`);
    this.running = true;

    try {
      while ((this.linkQueue.hasUnvisitedUrls() || this.activeRequests > 0) && this.crawledPages < this.config.maxPages && !this.stopRequested) {
        while (this.activeRequests < this.config.concurrency && this.linkQueue.hasUnvisitedUrls() && this.crawledPages < this.config.maxPages && !this.stopRequested) {
          const url = this.linkQueue.getNextUrl();
          if (url) {
            this.activeRequests++;
            await this.crawlPage(url).finally(() => this.activeRequests--);
          }
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      this.eventEmitter.emit('log', `Crawl error: ${(error as Error).message}`);
    } finally {
      this.running = false;
    }

    if (this.stopRequested) {
      this.eventEmitter.emit('log', 'Crawling stopped by user request.');
    } else {
      this.eventEmitter.emit('log', `Crawling completed. Visited ${this.crawledPages} pages.`);
    }
    return this.results;
  }

  stop(): void {
    this.stopRequested = true;
    this.eventEmitter.emit('log', 'Stop requested. Crawler will finish current pages and then stop.');
  }

  isRunning(): boolean {
    return this.running;
  }

  private async crawlPage(url: string, retryCount = 0): Promise<void> {
    if (this.stopRequested) return;

    const isInitialUrl = url === this.startUrl.href;

    const existingPage = await this.getExistingPageInfo(url);
    if (!isInitialUrl && existingPage) {
      const lastCrawlDate = new Date(existingPage.crawl_date);
      const daysSinceLastCrawl = (Date.now() - lastCrawlDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLastCrawl < this.config.recrawlAfterDays) {
        this.eventEmitter.emit('log', `Skipping ${url} - crawled ${daysSinceLastCrawl.toFixed(1)} days ago`);
        return;
      }
    }

    this.linkQueue.markVisited(url);
    this.crawledPages++;
    this.eventEmitter.emit('log', `Crawling: ${url} (${this.crawledPages}/${this.config.maxPages})`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      const html = await response.text();
      const $: CheerioAPI = load(html);

      const pageInfo = extractPageInfo($, url, this.normalizeEmail.bind(this));

      const newEmails = await this.emailFilter.filterNewEmails(pageInfo.emails);

      if (newEmails.length > 0 || isInitialUrl) {
        pageInfo.emails = newEmails;
        this.results.push(pageInfo);
        this.eventEmitter.emit('result', pageInfo);
        this.eventEmitter.emit('log', `Found ${newEmails.length} new email(s) on ${url}`);

        // Use QueueManager to store the data
        await queueManager.addToQueue(pageInfo);
      } else {
        this.eventEmitter.emit('log', `No new emails found on ${url}`);
      }

      // Insert unique emails into the 'emails' table
      if (newEmails.length > 0) {
        await this.emailFilter.insertUniqueEmails(newEmails);
      }

      if (this.crawledPages < this.config.maxPages && !this.stopRequested) {
        const newLinks = queueLinks($, url, this.linkQueue);
        this.eventEmitter.emit('log', `Queued ${newLinks} new links from ${url}`);
      }

      this.eventEmitter.emit('progress', this.crawledPages, this.config.maxPages);
    } catch (error) {
      this.eventEmitter.emit('log', `Error crawling ${url}: ${(error as Error).message}`);

      if (error instanceof Error && error.name === 'AbortError' && retryCount < this.config.maxRetries) {
        this.eventEmitter.emit('log', `Retrying ${url} (Attempt ${retryCount + 1}/${this.config.maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
        return this.crawlPage(url, retryCount + 1);
      }

      this.errors.push({ url, error: (error as Error).message });
    }
  }

  private async getExistingPageInfo(url: string): Promise<PageInfo | null> {
    try {
      const { data, error } = await this.supabase
        .from('crawled_data')
        .select('*')
        .eq('url', url)
        .order('crawl_date', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        return data[0] as PageInfo;
      } else {
        return null;
      }
    } catch (error) {
      this.eventEmitter.emit('log', `Error fetching existing page info: ${(error as Error).message}`);
      return null;
    }
  }

  private normalizeEmail(email: string): string {
    return this.config.normalizeEmails ? email.toLowerCase().trim() : email;
  }
}
