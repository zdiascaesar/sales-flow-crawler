import cheerio from 'cheerio';
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

  async queueLinks($: cheerio.Root, baseUrl: string, page: Page): Promise<number> {
    let queuedCount = 0;
    const links: Set<string> = new Set();

    $('a').each((_, element) => {
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

    for (const href of links) {
      try {
        const fullUrl = new URL(href, baseUrl).href;
        if (fullUrl.startsWith(this.startUrl.origin) && !this.visited.has(fullUrl) && !this.queue.includes(fullUrl)) {
          this.queue.push(fullUrl);
          queuedCount++;
        }
      } catch (error) {
        console.log(`Invalid URL: ${href}. Error: ${(error as Error).message}`);
      }
    }

    return queuedCount;
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
}
