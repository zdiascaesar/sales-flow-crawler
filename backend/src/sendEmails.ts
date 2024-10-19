import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import fs from 'fs';
import OpenAI from 'openai';
import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';
import { URL } from 'url';
import https from 'https';

console.log('Script started');

function log(message: string) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp}: ${message}\n`;
  console.log(message);
  fs.appendFileSync('email_log.txt', logMessage);
}

dotenv.config();
log('Environment variables loaded');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;

log('Supabase URL: ' + (supabaseUrl ? 'Set' : 'Not set'));
log('Supabase Key: ' + (supabaseKey ? 'Set' : 'Not set'));
log('OpenAI API Key: ' + (openaiApiKey ? 'Set' : 'Not set'));

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL or API Key is missing. Please check your .env file.');
}

if (!openaiApiKey) {
  throw new Error('OpenAI API Key is missing. Please check your .env file.');
}

log('Initializing clients');

const supabase = createClient(supabaseUrl, supabaseKey);
const openai = new OpenAI({ apiKey: openaiApiKey });

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_PORT === '465',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

log('Clients initialized');

class LinkQueue {
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

  async queueLinks($: cheerio.CheerioAPI, baseUrl: string): Promise<number> {
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
}

async function fetchWithSSLBypass(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, { rejectUnauthorized: false }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function crawl(startUrl: string, maxPages = 10, concurrency = 5) {
  const linkQueue = new LinkQueue(startUrl);
  const results: Array<{ url: string; title: string; description: string; bodyText: string }> = [];
  let crawledPages = 0;
  let activeRequests = 0;

  log(`Starting crawl from ${startUrl}`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors'],
    timeout: 30000
  });

  try {
    while ((linkQueue.hasUnvisitedUrls() || activeRequests > 0) && crawledPages < maxPages) {
      while (activeRequests < concurrency && linkQueue.hasUnvisitedUrls() && crawledPages < maxPages) {
        const url = linkQueue.getNextUrl();
        if (url) {
          activeRequests++;
          crawledPages++;
          crawlPage(url, browser, linkQueue, results).finally(() => activeRequests--);
        }
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  } catch (error) {
    if (error instanceof Error) {
      log(`Crawl error: ${error.message}`);
    } else {
      log(`Crawl error: ${error}`);
    }
  } finally {
    await browser.close();
  }

  log(`Crawling completed. Visited ${crawledPages} pages.`);
  return results;
}

async function crawlPage(url: string, browser: puppeteer.Browser, linkQueue: LinkQueue, results: Array<{ url: string; title: string; description: string; bodyText: string }>) {
  linkQueue.markVisited(url);
  log(`Crawling: ${url}`);

  try {
    let html: string;
    try {
      const page = await browser.newPage();
      await page.setDefaultNavigationTimeout(30000);
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      html = await page.content();
      await page.close();
    } catch (error) {
      if (error instanceof Error) {
        log(`Error using Puppeteer for ${url}: ${error.message}. Trying SSL bypass...`);
      } else {
        log(`Error using Puppeteer for ${url}: ${error}. Trying SSL bypass...`);
      }
      html = await fetchWithSSLBypass(url);
    }

    const $ = cheerio.load(html);
    const pageInfo = extractPageInfo($, url);
    results.push(pageInfo);

    await linkQueue.queueLinks($, url);
  } catch (error) {
    if (error instanceof Error) {
      log(`Error crawling ${url}: ${error.message}`);
    } else {
      log(`Error crawling ${url}: ${error}`);
    }
    // Add a fallback method for content extraction
    results.push({
      url,
      title: 'Unable to extract title',
      description: 'Unable to extract description',
      bodyText: `Failed to crawl this page. Error: ${error instanceof Error ? error.message : error}`
    });
  }
}

function extractPageInfo($: cheerio.CheerioAPI, url: string) {
  const title = $('title').text() || 'No title found';
  const description = $('meta[name="description"]').attr('content') || 'No description found';
  const bodyText = $('body').text().slice(0, 1000) || 'No body text found'; // Get first 1000 characters of body text
  return { url, title, description, bodyText };
}

async function fetchEmails() {
  log('Fetching emails from Supabase...');
  const { data, error } = await supabase
    .from('emails')
    .select('email');

  if (error) {
    throw new Error(`Error fetching emails: ${error.message}`);
  }

  return data.map(row => row.email);
}

function isBusinessEmail(email: string): boolean {
  const commonPersonalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'];
  const domain = email.split('@')[1];
  return !commonPersonalDomains.includes(domain);
}

async function generateEmailContent(email: string, websiteContent = '') {
  try {
    const prompt = `Generate a personalized email subject and body based on the following information:

Recipient email: ${email}
Is business email: ${isBusinessEmail(email)}
Website content: ${websiteContent}

Create a unique and personalized email introducing Google and its services. If it's a business email, tailor the content to the company's potential needs based on the website content. If it's a personal email, focus on personal benefits of Google services.

Format the email body with proper paragraphs and line breaks.

Please format your response as a valid JSON object with "subject" and "body" fields. Do not include any additional text or formatting outside of the JSON object. For example:
{"subject": "Your personalized subject here", "body": "Your personalized email body here\\n\\nWith proper formatting and paragraphs."}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {"role": "system", "content": "You are a helpful assistant that generates personalized email content in valid JSON format with proper formatting."},
        {"role": "user", "content": prompt}
      ],
      max_tokens: 1000
    });

    const content = completion.choices[0].message.content?.trim() || '';
    
    // Sanitize and parse the content
    const sanitizedContent = content.replace(/^[^{]*/, '').replace(/[^}]*$/, '');
    const parsedContent = JSON.parse(sanitizedContent);
    
    if (typeof parsedContent.subject === 'string' && typeof parsedContent.body === 'string') {
      return parsedContent;
    } else {
      throw new Error('Invalid content structure');
    }
  } catch (error) {
    if (error instanceof Error) {
      log(`Error generating email content: ${error.message}`);
    } else {
      log(`Error generating email content: ${error}`);
    }
    return { 
      subject: 'Introduction from Google', 
      body: 'Error generating personalized content. This is a default message.' 
    };
  }
}

async function sendEmail(to: string, subject: string, content: string) {
  const htmlContent = content.split('\n').map(paragraph => `<p>${paragraph}</p>`).join('');
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: to,
    subject: subject,
    text: content,
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    log(`Email sent to ${to}: ${info.messageId}`);
    return true;
  } catch (error) {
    if (error instanceof Error) {
      log(`Error sending email to ${to}: ${error.message}`);
    } else {
      log(`Error sending email to ${to}: ${error}`);
    }
    return false;
  }
}

export async function main() {
  try {
    const emails = await fetchEmails();
    
    if (emails.length === 0) {
      log('No emails found to send to.');
      return;
    }

    log(`Found ${emails.length} email(s) to send to.`);

    for (const email of emails) {
      const isBusiness = isBusinessEmail(email);
      log(`Email ${email} identified as ${isBusiness ? 'business' : 'personal'} email`);
      
      let websiteContent = '';
      if (isBusiness) {
        const domain = email.split('@')[1];
        const startUrl = `https://${domain}`;
        log(`Crawling website for ${domain}`);
        const crawlResults = await crawl(startUrl, 5, 2); // Crawl up to 5 pages with 2 concurrent requests
        
        websiteContent = crawlResults.map(result => `${result.title}\n${result.description}\n${result.bodyText}`).join('\n\n');
      }
      
      log(`Generating email content for ${email}`);
      const { subject, body } = await generateEmailContent(email, websiteContent);
      
      log(`Sending email to ${email}`);
      await sendEmail(email, subject, body);
      
      // Basic rate limiting: wait for 1 second between emails
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    log('Email sending process completed.');
  } catch (error) {
    if (error instanceof Error) {
      log(`Error in main function: ${error.message}`);
    } else {
      log(`Error in main function: ${error}`);
    }
  }
}


