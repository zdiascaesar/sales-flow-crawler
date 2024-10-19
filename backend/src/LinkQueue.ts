import { URL } from 'url';
import { CheerioAPI } from 'cheerio';

export class LinkQueue {
  private startUrl: URL;
  private queue: string[];
  private visited: Set<string>;

  constructor(startUrl: string) {
    this.startUrl = new URL(startUrl);
    this.queue = [this.startUrl.href];
    this.visited = new Set();
  }

  hasUnvisitedUrls(): boolean {
    return this.queue.length > 0;
  }

  getNextUrl(): string | undefined {
    return this.queue.shift();
  }

  markVisited(url: string): void {
    this.visited.add(url);
  }

  isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch (error) {
      return false;
    }
  }

  async queueLinks($: CheerioAPI, baseUrl: string): Promise<number> {
    const links = $('a')
      .map((i, el) => $(el).attr('href'))
      .get();

    const newLinks = links.filter(link => {
      try {
        const fullUrl = new URL(link, baseUrl);
        return fullUrl.hostname === this.startUrl.hostname && 
               !this.visited.has(fullUrl.href) && 
               !this.queue.includes(fullUrl.href);
      } catch (error) {
        return false;
      }
    });

    this.queue.push(...newLinks);
    return newLinks.length;
  }

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
