import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import OpenAI from 'openai';
import cheerio from 'cheerio';
import * as puppeteer from 'puppeteer';
import https from 'https';
import { supabase, supabaseUrl, supabaseKey } from './config';
import { LinkQueue } from './LinkQueue';
import { logger } from './logger';

interface PageInfo {
  url: string;
  title: string;
  description: string;
  bodyText: string;
}

interface EmailContent {
  subject: string;
  body: string;
}

interface EmailRecord {
  email: string;
  email_sent_date: string | null;
}

const DEFAULT_EMAIL_CONTENT: EmailContent = {
  subject: "Добрый день уважаемые Господа!",
  body: "Просим Вас ознакомиться с предложением по поставке промышленного оборудования и по возможности передать своим коллегам. Наша компания ТОО «АГНА+» имеет опыт поставок широкого спектра промышленной иностранной продукции (КИПиА, электротехника, агрегаты, насосы, механика) в том числе поставляем широкий спектр химических реагентов и промышленных масел. Вся информация в официальном письме в приложении, а также в презентационном материале ниже:\nhttps://drive.google.com/file/d/1HB6JIYOy_d551hKqE_rY1TCUmF7B74uo/view?usp=sharing"
};

const MINIMUM_DAYS_BETWEEN_EMAILS = 7;

dotenv.config();
logger.info('Script started');

logger.info('Environment variables loaded');

const openaiApiKey = process.env.OPENAI_API_KEY;

logger.info('Supabase URL: ' + (supabaseUrl ? 'Set' : 'Not set'));
logger.info('Supabase Key: ' + (supabaseKey ? 'Set' : 'Not set'));
logger.info('OpenAI API Key: ' + (openaiApiKey ? 'Set' : 'Not set'));

if (!openaiApiKey) {
  throw new Error('OpenAI API Key is missing. Please check your .env file.');
}

logger.info('Initializing clients');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_PORT === '465',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

logger.info('Clients initialized');

function isEmailEligibleToSend(lastSentDate: string | null): boolean {
  if (!lastSentDate) return true;

  const lastSent = new Date(lastSentDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - lastSent.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays >= MINIMUM_DAYS_BETWEEN_EMAILS;
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

async function crawl(startUrl: string, maxPages = 10, concurrency = 5): Promise<PageInfo[]> {
  const linkQueue = new LinkQueue(startUrl);
  const results: PageInfo[] = [];
  let crawledPages = 0;
  let activeRequests = 0;

  logger.info(`Starting crawl from ${startUrl}`);

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
    logger.error('Crawl error:', error);
  } finally {
    await browser.close();
  }

  logger.info(`Crawling completed. Visited ${crawledPages} pages.`);
  return results;
}

async function crawlPage(url: string, browser: puppeteer.Browser, linkQueue: LinkQueue, results: PageInfo[]): Promise<void> {
  linkQueue.markVisited(url);
  logger.info(`Crawling: ${url}`);

  try {
    let html: string;
    try {
      const page = await browser.newPage();
      await page.setDefaultNavigationTimeout(30000);
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      html = await page.content();
      await page.close();
    } catch (error) {
      logger.error(`Error using Puppeteer for ${url}. Trying SSL bypass...`, error);
      html = await fetchWithSSLBypass(url);
    }

    const $ = cheerio.load(html);
    const pageInfo = extractPageInfo($, url);
    results.push(pageInfo);

    await linkQueue.queueLinks($, url);
  } catch (error) {
    logger.error(`Error crawling ${url}:`, error);
    results.push({
      url,
      title: 'Unable to extract title',
      description: 'Unable to extract description',
      bodyText: `Failed to crawl this page. Error: ${error instanceof Error ? error.message : String(error)}`
    });
  }
}

function extractPageInfo($: cheerio.CheerioAPI, url: string): PageInfo {
  const title = $('title').text() || 'No title found';
  const description = $('meta[name="description"]').attr('content') || 'No description found';
  const bodyText = $('body').text().slice(0, 1000) || 'No body text found';
  return { url, title, description, bodyText };
}

async function fetchEmails(): Promise<string[]> {
  logger.info('Fetching emails from Supabase...');
  const { data, error } = await supabase
    .from('emails')
    .select('email, email_sent_date');

  if (error) {
    throw new Error(`Error fetching emails: ${error.message}`);
  }

  const eligibleEmails = data
    .filter((record: EmailRecord) => isEmailEligibleToSend(record.email_sent_date))
    .map((record: EmailRecord) => record.email);

  logger.info(`Found ${data.length} total emails, ${eligibleEmails.length} are eligible to send`);
  
  return eligibleEmails;
}

async function updateEmailSentDate(email: string): Promise<void> {
  const { error } = await supabase
    .from('emails')
    .update({ email_sent_date: new Date().toISOString() })
    .eq('email', email);

  if (error) {
    logger.error(`Error updating email_sent_date for ${email}:`, error);
    throw error;
  }
  
  logger.info(`Updated email_sent_date for ${email}`);
}

function isBusinessEmail(email: string): boolean {
  const commonPersonalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'mail.com', 'yandex.com', 'protonmail.com', 'zoho.com', 'gmx.com', 'fastmail.com', 'hushmail.com', 'tutanota.com', 'inbox.com', 'mail.ru', 'bk.ru', 'list.ru', 'inbox.ru', 'rambler.ru', 'qq.com', 'nate.com', 'naver.com', '163.com', '126.com', 'sina.com', 'daum.net', 'rediffmail.com', 'web.de', 'libero.it', 'virgilio.it', 'wanadoo.fr', 'orange.fr'];
  const domain = email.split('@')[1];
  return !commonPersonalDomains.includes(domain);
}

async function generateEmailContent(email: string, websiteContent = ''): Promise<EmailContent> {
  try {
    const prompt = `
Вы - полезный ассистент ИИ, который генерирует персонализированное email-содержимое в правильном формате JSON с надлежащим форматированием на русском языке.

Сгенерируйте персонализированное email-письмо на русском языке с темой и телом, основанными на следующей информации:

Адрес электронной почты получателя: ${email}
Является ли это бизнес-email: ${isBusinessEmail(email)}
Содержание веб-сайта: ${websiteContent}

Создайте уникальное и персонализированное письмо, представляющее Google и его услуги. Если это бизнес-email, адаптируйте контент к потенциальным потребностям компании на основе содержимого веб-сайта. Если это личный email, сосредоточьтесь на личной выгоде от услуг Google.

Важные правила:
1. Не добавляйте подпись или прощание в конце письма если такого не было дано(например, "С уважением", "Best regards" и т.д.)
2. Отформатируйте тело письма с правильными абзацами и разрывами строк
3. Письмо должно заканчиваться основным содержанием без дополнительных формальностей если такого не было дано

Пожалуйста, отформатируйте ответ в виде действительного объекта JSON с полями "subject" и "body". Не включайте никакой дополнительный текст или форматирование за пределами объекта JSON. Если по какой-либо причине не удается сгенерировать персонализированное письмо, используйте следующий текст по умолчанию:

${JSON.stringify(DEFAULT_EMAIL_CONTENT, null, 2)}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { "role": "system", "content": prompt }
      ],
      max_tokens: 1000
    });

    const content = response.choices[0]?.message?.content?.trim() || '';
    
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
    logger.error('Ошибка при генерации содержимого электронной почты:', error);
    return DEFAULT_EMAIL_CONTENT;
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
    logger.info(`Email sent to ${to}: ${info.messageId}`);
    return true;
  } catch (updateError) {
    logger.error(`Error sending email to ${to}:`, updateError);
    return false;
  }
}

export async function main(): Promise<void> {
  try {
    const emails = await fetchEmails();
    const totalEmails = emails.length;
    
    if (totalEmails === 0) {
      logger.info('No emails eligible to send at this time.');
      return;
    }

    logger.info(`Starting email sending process. Total emails to send: ${totalEmails}`);
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];
      const currentProgress = i + 1;
      
      logger.info(`Progress: ${currentProgress}/${totalEmails} (${Math.round((currentProgress/totalEmails) * 100)}%)`);
      
      const isBusiness = isBusinessEmail(email);
      logger.info(`Processing ${email} (${isBusiness ? 'business' : 'personal'} email)`);
      
      let websiteContent = '';
      if (isBusiness) {
        const domain = email.split('@')[1];
        const startUrl = `https://${domain}`;
        logger.info(`Crawling website for ${domain}`);
        const crawlResults = await crawl(startUrl, 5, 2);
        
        websiteContent = crawlResults.map(result => `${result.title}\n${result.description}\n${result.bodyText}`).join('\n\n');
      }
      
      logger.info(`Generating email content for ${email}`);
      const { subject, body } = await generateEmailContent(email, websiteContent);
      
      logger.info(`Sending email to ${email}`);
      const success = await sendEmail(email, subject, body);
      
      if (success) {
        successCount++;
        try {
          await updateEmailSentDate(email);
        } catch (updateError) {
          logger.error(`Failed to update email_sent_date for ${email}, but email was sent successfully:`, updateError);
        }
      } else {
        failureCount++;
      }

      logger.info(`Current stats - Success: ${successCount}, Failed: ${failureCount}`);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    logger.info('Email sending process completed.');
    logger.info(`Final results - Total: ${totalEmails}, Success: ${successCount}, Failed: ${failureCount}`);
  } catch (mainError) {
    logger.error('Error in main function:', mainError);
  }
}
