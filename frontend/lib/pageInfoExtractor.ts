import * as cheerio from 'cheerio';
import { PageInfo } from './types';

export function extractPageInfo($: cheerio.Root, url: string, normalizeEmail: (email: string) => string): PageInfo {
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
