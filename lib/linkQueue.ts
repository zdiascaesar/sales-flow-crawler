import { CheerioAPI } from 'cheerio';
import { Element } from 'domhandler';
import { Page } from 'puppeteer';
import { URL } from 'url';

export class LinkQueue {
  private queue: string[];
  private visited: Set<string>;
  private startUrl: URL;

  constructor(startUrl: URL) {
    this.queue = [startUrl.href];
    this.visited = new Set();
    this.startUrl = startUrl;
  }

  getNextUrl(): string | undefined {
    return this.queue.shift();
  }

  markVisited(url: string): void {
    this.visited.add(url);
  }

  hasUnvisitedUrls(): boolean {
    return this.queue.length > 0;
  }

  addToQueue(url: string): void {
    if (!this.visited.has(url) && !this.queue.includes(url)) {
      this.queue.push(url);
    }
  }

  // New getter methods
  getQueue(): string[] {
    return this.queue;
  }

  getVisited(): Set<string> {
    return this.visited;
  }

  getStartUrl(): URL {
    return this.startUrl;
  }
}

export async function queueLinks($: CheerioAPI, baseUrl: string, page: Page): Promise<number> {
  let queuedCount = 0;
  const links: Set<string> = new Set();

  $('a').each((_: number, element: Element) => {
    const href = $(element).attr('href');
    if (href) links.add(href);
  });

  const jsLinks: string[] = await page.evaluate(() => {
    const links: string[] = [];
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
  jsLinks.forEach(link => links.add(link));

  const startUrl = new URL(baseUrl);
  const queue = new LinkQueue(startUrl);

  for (const href of links) {
    try {
      const fullUrl = new URL(href, baseUrl).href;
      if (fullUrl.startsWith(startUrl.origin)) {
        queue.addToQueue(fullUrl);
        queuedCount++;
      }
    } catch (error) {
      console.log(`Invalid URL: ${href}. Error: ${(error as Error).message}`);
    }
  }

  return queuedCount;
}
