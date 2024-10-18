"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailInfoCrawler = void 0;
const fs = __importStar(require("fs"));
const cheerio = __importStar(require("cheerio"));
const url_1 = require("url");
const puppeteer_1 = __importDefault(require("puppeteer"));
const supabase_js_1 = require("@supabase/supabase-js");
const queueManager_1 = require("./queueManager");
class EmailInfoCrawler {
    constructor(configPath) {
        this.config = this.loadConfig(configPath);
        this.startUrl = new url_1.URL(this.config.startUrl);
        this.visited = new Set();
        this.results = [];
        this.queue = [];
        this.activeRequests = 0;
        this.errors = [];
        this.startTime = new Date().toISOString();
        this.crawledPages = 0;
        this.eventListeners = {
            progress: [],
            result: [],
            log: []
        };
        this.stopRequested = false;
        this.crawledEmails = new Set();
        this.running = false;
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl || !supabaseServiceRoleKey) {
            throw new Error('Supabase URL or service role key is missing from environment variables');
        }
        this.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceRoleKey);
        this.emit('log', 'Supabase client initialized');
    }
    loadConfig(configPath) {
        try {
            const configFile = fs.readFileSync(configPath, 'utf8');
            const config = JSON.parse(configFile);
            return {
                ...config,
                recrawlAfterDays: config.recrawlAfterDays || 30,
                maxRetries: config.maxRetries || 3
            };
        }
        catch (error) {
            console.error(`Error loading configuration: ${error.message}`);
            throw error;
        }
    }
    normalizeEmail(email) {
        return this.config.normalizeEmails ? email.toLowerCase().trim() : email;
    }
    on(event, callback) {
        this.eventListeners[event].push(callback);
    }
    emit(event, ...args) {
        const listeners = this.eventListeners[event];
        listeners.forEach(callback => {
            callback(...args);
        });
    }
    async crawl(startUrl, maxPages, concurrency) {
        this.startUrl = new url_1.URL(startUrl);
        this.config.maxPages = maxPages || this.config.maxPages;
        this.config.concurrency = concurrency || this.config.concurrency;
        this.queue = [this.startUrl.href];
        this.visited.clear();
        this.results = [];
        this.crawledPages = 0;
        this.errors = [];
        this.startTime = new Date().toISOString();
        console.log(`Starting crawl from ${this.startUrl}`);
        this.emit('log', `Starting crawl from ${this.startUrl}`);
        this.running = true;
        const browser = await puppeteer_1.default.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            timeout: this.config.timeout
        });
        try {
            while ((this.queue.length > 0 || this.activeRequests > 0) && this.crawledPages < this.config.maxPages && !this.stopRequested) {
                while (this.activeRequests < this.config.concurrency && this.queue.length > 0 && this.crawledPages < this.config.maxPages && !this.stopRequested) {
                    const url = this.queue.shift();
                    if (url && !this.visited.has(url)) {
                        this.activeRequests++;
                        await this.crawlPage(url, browser).finally(() => this.activeRequests--);
                    }
                }
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        catch (error) {
            console.error(`Crawl error: ${error.message}`);
            this.emit('log', `Crawl error: ${error.message}`);
        }
        finally {
            await browser.close();
            this.running = false;
        }
        if (this.stopRequested) {
            console.log('Crawling stopped by user request.');
            this.emit('log', 'Crawling stopped by user request.');
        }
        else {
            console.log(`Crawling completed. Visited ${this.crawledPages} pages.`);
            this.emit('log', `Crawling completed. Visited ${this.crawledPages} pages.`);
        }
        return this.results;
    }
    stop() {
        this.stopRequested = true;
        console.log('Stop requested. Crawler will finish current pages and then stop.');
        this.emit('log', 'Stop requested. Crawler will finish current pages and then stop.');
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
                this.emit('log', `Skipping ${url} - crawled ${daysSinceLastCrawl.toFixed(1)} days ago`);
                return;
            }
        }
        this.visited.add(url);
        this.crawledPages++;
        console.log(`Crawling: ${url} (${this.crawledPages}/${this.config.maxPages})`);
        this.emit('log', `Crawling: ${url} (${this.crawledPages}/${this.config.maxPages})`);
        try {
            const page = await browser.newPage();
            await page.setDefaultNavigationTimeout(this.config.timeout);
            await page.goto(url, { waitUntil: 'domcontentloaded' });
            const html = await page.content();
            const $ = cheerio.load(html);
            const pageInfo = this.extractPageInfo($, url);
            const newEmails = await this.filterNewEmails(pageInfo.emails);
            if (newEmails.length > 0 || isInitialUrl) {
                pageInfo.emails = newEmails;
                this.results.push(pageInfo);
                this.emit('result', pageInfo);
                console.log(`Found ${newEmails.length} new email(s) on ${url}`);
                this.emit('log', `Found ${newEmails.length} new email(s) on ${url}`);
                // Use QueueManager to store the data
                await queueManager_1.queueManager.addToQueue(pageInfo);
            }
            else {
                console.log(`No new emails found on ${url}`);
                this.emit('log', `No new emails found on ${url}`);
            }
            if (this.crawledPages < this.config.maxPages && !this.stopRequested) {
                const newLinks = await this.queueLinks($, url, page);
                console.log(`Queued ${newLinks} new links from ${url}`);
                this.emit('log', `Queued ${newLinks} new links from ${url}`);
            }
            await page.close();
            this.emit('progress', this.crawledPages, this.config.maxPages);
        }
        catch (error) {
            console.error(`Error crawling ${url}: ${error.message}`);
            this.emit('log', `Error crawling ${url}: ${error.message}`);
            if (error instanceof Error && error.name === 'ResponseAborted' && retryCount < this.config.maxRetries) {
                console.log(`Retrying ${url} (Attempt ${retryCount + 1}/${this.config.maxRetries})`);
                this.emit('log', `Retrying ${url} (Attempt ${retryCount + 1}/${this.config.maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
                return this.crawlPage(url, browser, retryCount + 1);
            }
            this.errors.push({ url, error: error.message });
        }
    }
    extractPageInfo($, url) {
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/g;
        const body = $('body').text();
        const emails = [...new Set((body.match(emailRegex) || []).map(email => this.normalizeEmail(email)))];
        return {
            url: url,
            page_title: $('title').text().trim(),
            page_description: $('meta[name="description"]').attr('content') || '',
            page_body: body,
            emails: emails,
            crawl_date: new Date().toISOString()
        };
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
            this.emit('log', `Error fetching existing page info: ${error.message}`);
            return null;
        }
    }
    async filterNewEmails(emails) {
        try {
            const { data, error } = await this.supabase
                .from('crawled_data')
                .select('emails');
            if (error)
                throw error;
            const allExistingEmails = new Set(data.flatMap(row => row.emails));
            const newEmails = emails.filter(email => !allExistingEmails.has(email) && !this.crawledEmails.has(email));
            // Add new emails to the crawledEmails set
            newEmails.forEach(email => this.crawledEmails.add(email));
            return newEmails;
        }
        catch (error) {
            console.error(`Error filtering new emails: ${error.message}`);
            this.emit('log', `Error filtering new emails: ${error.message}`);
            return emails;
        }
    }
    async queueLinks($, baseUrl, page) {
        let queuedCount = 0;
        const links = new Set();
        $('a').each((_, element) => {
            const href = $(element).attr('href');
            if (href)
                links.add(href);
        });
        const jsLinks = await page.evaluate(() => {
            const links = [];
            const onClick = /(?:location\.href|window\.open)\s*=\s*['"]([^'"]+)['"]/g;
            const scripts = document.getElementsByTagName('script');
            Array.from(scripts).forEach((script) => {
                let match;
                while ((match = onClick.exec(script.innerHTML)) !== null) {
                    links.push(match[1]);
                }
            });
            return links;
        });
        jsLinks.forEach((link) => links.add(link));
        for (const href of links) {
            try {
                const fullUrl = new url_1.URL(href, baseUrl).href;
                if (fullUrl.startsWith(this.startUrl.origin) && !this.visited.has(fullUrl) && !this.queue.includes(fullUrl)) {
                    this.queue.push(fullUrl);
                    queuedCount++;
                }
            }
            catch (error) {
                console.log(`Invalid URL: ${href}. Error: ${error.message}`);
                this.emit('log', `Invalid URL: ${href}. Error: ${error.message}`);
            }
        }
        return queuedCount;
    }
}
exports.EmailInfoCrawler = EmailInfoCrawler;
//# sourceMappingURL=emailInfoCrawler.js.map