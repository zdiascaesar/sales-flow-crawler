import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import fs from 'fs';
import { Configuration, OpenAIApi } from 'openai';
import axios from 'axios';
import cheerio from 'cheerio';
import * as puppeteer from 'puppeteer';
import https from 'https';
import { supabase, supabaseUrl, supabaseKey } from './config';
import { LinkQueue } from './LinkQueue';

dotenv.config();
console.log('Script started');

function log(message: string): void {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp}: ${message}\n`;
  console.log(message);
  fs.appendFileSync('email_log.txt', logMessage);
}

log('Environment variables loaded');

const openaiApiKey = process.env.OPENAI_API_KEY;

log('Supabase URL: ' + (supabaseUrl ? 'Set' : 'Not set'));
log('Supabase Key: ' + (supabaseKey ? 'Set' : 'Not set'));
log('OpenAI API Key: ' + (openaiApiKey ? 'Set' : 'Not set'));

if (!openaiApiKey) {
  throw new Error('OpenAI API Key is missing. Please check your .env file.');
}

log('Initializing clients');

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

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

async function fetchWithSSLBypass(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, { rejectUnauthorized: false }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function crawl(startUrl: string, maxPages = 10, concurrency = 5): Promise<any[]> {
  const linkQueue = new LinkQueue(startUrl);
  const results: any[] = [];
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
    log(`Crawl error: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    await browser.close();
  }

  log(`Crawling completed. Visited ${crawledPages} pages.`);
  return results;
}

async function crawlPage(url: string, browser: puppeteer.Browser, linkQueue: LinkQueue, results: any[]): Promise<void> {
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
      log(`Error using Puppeteer for ${url}: ${error instanceof Error ? error.message : String(error)}. Trying SSL bypass...`);
      html = await fetchWithSSLBypass(url);
    }

    const $ = cheerio.load(html);
    const pageInfo = extractPageInfo($, url);
    results.push(pageInfo);

    await linkQueue.queueLinks($, url);
  } catch (error) {
    log(`Error crawling ${url}: ${error instanceof Error ? error.message : String(error)}`);
    results.push({
      url,
      title: 'Unable to extract title',
      description: 'Unable to extract description',
      bodyText: `Failed to crawl this page. Error: ${error instanceof Error ? error.message : String(error)}`
    });
  }
}

function extractPageInfo($: cheerio.CheerioAPI, url: string): { url: string; title: string; description: string; bodyText: string } {
  const title = $('title').text() || 'No title found';
  const description = $('meta[name="description"]').attr('content') || 'No description found';
  const bodyText = $('body').text().slice(0, 1000) || 'No body text found';
  return { url, title, description, bodyText };
}

async function fetchEmails(): Promise<string[]> {
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
  const commonPersonalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'mail.com', 'yandex.com', 'protonmail.com', 'zoho.com', 'gmx.com', 'fastmail.com', 'hushmail.com', 'tutanota.com', 'inbox.com', 'mail.ru', 'bk.ru', 'list.ru', 'inbox.ru', 'rambler.ru', 'qq.com', 'nate.com', 'naver.com', '163.com', '126.com', 'sina.com', 'daum.net', 'rediffmail.com', 'web.de', 'libero.it', 'virgilio.it', 'wanadoo.fr', 'orange.fr'];
  const domain = email.split('@')[1];
  return !commonPersonalDomains.includes(domain);
}

async function generateEmailContent(email: string, websiteContent = ''): Promise<{ subject: string; body: string }> {
  try {
    const prompt = `Generate a personalized email subject and body based on the following information:

Recipient email: ${email}
Is business email: ${isBusinessEmail(email)}
Website content: ${websiteContent}

Create a unique and personalized email introducing Google and its services. If it's a business email, tailor the content to the company's potential needs based on the website content. If it's a personal email, focus on personal benefits of Google services.

Format the email body with proper paragraphs and line breaks.

Please format your response as a valid JSON object with "subject" and "body" fields. Do not include any additional text or formatting outside of the JSON object. For example:
{"subject": "Your personalized subject here", "body": "Your personalized email body here\\n\\nWith proper formatting and paragraphs."}`;

    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {"role": "system", "content": "You are a helpful assistant that generates personalized email content in valid JSON format with proper formatting."},
        {"role": "user", "content": prompt}
      ],
      max_tokens: 1000
    });

    const content = response.data.choices[0]?.message?.content?.trim() || '';
    
    if (!content) {
      throw new Error('No content generated from OpenAI');
    }

    const sanitizedContent = content.replace(/^[^{]*/, '').replace(/[^}]*$/, '');
    const parsedContent = JSON.parse(sanitizedContent);
    
    if (typeof parsedContent.subject === 'string' && typeof parsedContent.body === 'string') {
      return parsedContent;
    } else {
      throw new Error('Invalid content structure');
    }
  } catch (error) {
    log(`Error generating email content: ${error instanceof Error ? error.message : String(error)}`);
    return { 
      subject: 'Introduction from Google', 
      body: 'Error generating personalized content. This is a default message.' 
    };
  }
}

async function sendEmail(to: string, subject: string, content: string): Promise<boolean> {
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
    log(`Error sending email to ${to}: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

export async function main(): Promise<void> {
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
        const crawlResults = await crawl(startUrl, 5, 2);
        
        websiteContent = crawlResults.map(result => `${result.title}\n${result.description}\n${result.bodyText}`).join('\n\n');
      }
      
      log(`Generating email content for ${email}`);
      const { subject, body } = await generateEmailContent(email, websiteContent);
      
      log(`Sending email to ${email}`);
      await sendEmail(email, subject, body);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    log('Email sending process completed.');
  } catch (error) {
    log(`Error in main function: ${error instanceof Error ? error.message : String(error)}`);
  }
}
