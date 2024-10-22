export function extractPageInfo($, url, normalizeEmail) {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/g;
    const body = $('body').text();
    const emails = [...new Set((body.match(emailRegex) || []).map(email => normalizeEmail(email)))];
    return {
        url: url,
        page_title: $('title').text().trim(),
        page_description: $('meta[name="description"]').attr('content') || '',
        page_body: body,
        emails: emails,
        crawl_date: new Date().toISOString()
    };
}
//# sourceMappingURL=pageInfoExtractor.js.map