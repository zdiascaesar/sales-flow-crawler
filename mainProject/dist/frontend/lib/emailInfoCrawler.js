import { URL } from 'url';
import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import { loadConfig } from './config.js';
import { initializeSupabaseClient } from './supabaseClient.js';
import { EventEmitter } from './eventEmitter.js';
import { extractPageInfo } from './pageInfoExtractor.js';
import { LinkQueue } from './linkQueue.js';
import { EmailFilter } from './emailFilter.js';
import { queueManager } from './queueManager.js';
// The rest of the file remains unchanged
export class EmailInfoCrawler {
    constructor(configPath) {
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
    on(event, callback) {
        this.eventEmitter.on(event, callback);
    }
    async crawl(startUrl, maxPages, concurrency) {
        this.startUrl = new URL(startUrl);
        this.config.maxPages = maxPages || this.config.maxPages;
        this.config.concurrency = concurrency || this.config.concurrency;
        this.linkQueue = new LinkQueue(this.startUrl);
        this.results = [];
        this.crawledPages = 0;
        this.errors = [];
        this.startTime = new Date().toISOString();
        console.log(`Starting crawl from ${this.startUrl}`);
        this.eventEmitter.emit('log', `Starting crawl from ${this.startUrl}`);
        this.running = true;
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            timeout: this.config.timeout
        });
        try {
            while ((this.linkQueue.hasUnvisitedUrls() || this.activeRequests > 0) && this.crawledPages < this.config.maxPages && !this.stopRequested) {
                while (this.activeRequests < this.config.concurrency && this.linkQueue.hasUnvisitedUrls() && this.crawledPages < this.config.maxPages && !this.stopRequested) {
                    const url = this.linkQueue.getNextUrl();
                    if (url) {
                        this.activeRequests++;
                        await this.crawlPage(url, browser).finally(() => this.activeRequests--);
                    }
                }
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        catch (error) {
            console.error(`Crawl error: ${error.message}`);
            this.eventEmitter.emit('log', `Crawl error: ${error.message}`);
        }
        finally {
            await browser.close();
            this.running = false;
        }
        if (this.stopRequested) {
            console.log('Crawling stopped by user request.');
            this.eventEmitter.emit('log', 'Crawling stopped by user request.');
        }
        else {
            console.log(`Crawling completed. Visited ${this.crawledPages} pages.`);
            this.eventEmitter.emit('log', `Crawling completed. Visited ${this.crawledPages} pages.`);
        }
        return this.results;
    }
    stop() {
        this.stopRequested = true;
        console.log('Stop requested. Crawler will finish current pages and then stop.');
        this.eventEmitter.emit('log', 'Stop requested. Crawler will finish current pages and then stop.');
    }
    isRunning() {
        return this.running;
    }
    async crawlPage(url, browser, retryCount = 0) {
        if (this.stopRequested)
            return;
        const isInitialUrl = url === this.startUrl.href;
        const existingPage = await this.getExistingPageInfo(url);
        if (!isInitialUrl && existingPage) {
            const lastCrawlDate = new Date(existingPage.crawl_date);
            const daysSinceLastCrawl = (Date.now() - lastCrawlDate.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceLastCrawl < this.config.recrawlAfterDays) {
                console.log(`Skipping ${url} - crawled ${daysSinceLastCrawl.toFixed(1)} days ago`);
                this.eventEmitter.emit('log', `Skipping ${url} - crawled ${daysSinceLastCrawl.toFixed(1)} days ago`);
                return;
            }
        }
        this.linkQueue.markVisited(url);
        this.crawledPages++;
        console.log(`Crawling: ${url} (${this.crawledPages}/${this.config.maxPages})`);
        this.eventEmitter.emit('log', `Crawling: ${url} (${this.crawledPages}/${this.config.maxPages})`);
        try {
            const page = await browser.newPage();
            await page.setDefaultNavigationTimeout(this.config.timeout);
            await page.goto(url, { waitUntil: 'domcontentloaded' });
            const html = await page.content();
            const $ = cheerio.load(html);
            const pageInfo = extractPageInfo($, url, this.normalizeEmail.bind(this));
            const newEmails = await this.emailFilter.filterNewEmails(pageInfo.emails);
            if (newEmails.length > 0 || isInitialUrl) {
                pageInfo.emails = newEmails;
                this.results.push(pageInfo);
                this.eventEmitter.emit('result', pageInfo);
                console.log(`Found ${newEmails.length} new email(s) on ${url}`);
                this.eventEmitter.emit('log', `Found ${newEmails.length} new email(s) on ${url}`);
                // Use QueueManager to store the data
                await queueManager.addToQueue(pageInfo);
            }
            else {
                console.log(`No new emails found on ${url}`);
                this.eventEmitter.emit('log', `No new emails found on ${url}`);
            }
            // Insert unique emails into the 'emails' table
            if (newEmails.length > 0) {
                await this.emailFilter.insertUniqueEmails(newEmails);
            }
            if (this.crawledPages < this.config.maxPages && !this.stopRequested) {
                const newLinks = await this.linkQueue.queueLinks($, url, page);
                console.log(`Queued ${newLinks} new links from ${url}`);
                this.eventEmitter.emit('log', `Queued ${newLinks} new links from ${url}`);
            }
            await page.close();
            this.eventEmitter.emit('progress', this.crawledPages, this.config.maxPages);
        }
        catch (error) {
            console.error(`Error crawling ${url}: ${error.message}`);
            this.eventEmitter.emit('log', `Error crawling ${url}: ${error.message}`);
            if (error instanceof Error && error.name === 'ResponseAborted' && retryCount < this.config.maxRetries) {
                console.log(`Retrying ${url} (Attempt ${retryCount + 1}/${this.config.maxRetries})`);
                this.eventEmitter.emit('log', `Retrying ${url} (Attempt ${retryCount + 1}/${this.config.maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
                return this.crawlPage(url, browser, retryCount + 1);
            }
            this.errors.push({ url, error: error.message });
        }
    }
    async getExistingPageInfo(url) {
        try {
            const { data, error } = await this.supabase
                .from('crawled_data')
                .select('*')
                .eq('url', url)
                .order('crawl_date', { ascending: false })
                .limit(1);
            if (error)
                throw error;
            if (data && data.length > 0) {
                return data[0];
            }
            else {
                return null;
            }
        }
        catch (error) {
            console.error(`Error fetching existing page info: ${error.message}`);
            this.eventEmitter.emit('log', `Error fetching existing page info: ${error.message}`);
            return null;
        }
    }
    normalizeEmail(email) {
        return this.config.normalizeEmails ? email.toLowerCase().trim() : email;
    }
}
//# sourceMappingURL=emailInfoCrawler.js.map