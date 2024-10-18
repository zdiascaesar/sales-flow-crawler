import { URL } from 'url';
export class LinkQueue {
    constructor(startUrl) {
        this.queue = [startUrl.href];
        this.visited = new Set();
        this.startUrl = startUrl;
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
        jsLinks.forEach(link => links.add(link));
        for (const href of links) {
            try {
                const fullUrl = new URL(href, baseUrl).href;
                if (fullUrl.startsWith(this.startUrl.origin) && !this.visited.has(fullUrl) && !this.queue.includes(fullUrl)) {
                    this.queue.push(fullUrl);
                    queuedCount++;
                }
            }
            catch (error) {
                console.log(`Invalid URL: ${href}. Error: ${error.message}`);
            }
        }
        return queuedCount;
    }
    getNextUrl() {
        return this.queue.shift();
    }
    markVisited(url) {
        this.visited.add(url);
    }
    hasUnvisitedUrls() {
        return this.queue.length > 0;
    }
}
//# sourceMappingURL=linkQueue.js.map