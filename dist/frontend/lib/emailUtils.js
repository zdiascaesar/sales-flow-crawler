import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';
import nodemailer from 'nodemailer';
import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
const openai = new OpenAI({ apiKey: openaiApiKey });
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_PORT === '465',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});
export function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp}: ${message}\n`;
    console.log(message);
    fs.appendFileSync('email_log.txt', logMessage);
}
export async function fetchEmails() {
    log('Fetching emails from Supabase...');
    const { data, error } = await supabase
        .from('emails')
        .select('email');
    if (error)
        throw new Error(`Error fetching emails: ${error.message}`);
    if (!data || data.length === 0) {
        throw new Error('No recipients found');
    }
    log(`Found ${data.length} email(s) to send to.`);
    return data.map(row => row.email);
}
export function isBusinessEmail(email) {
    const commonPersonalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'];
    const domain = email.split('@')[1];
    return !commonPersonalDomains.includes(domain);
}
export async function crawlWebsite(url) {
    log(`Crawling website: ${url}`);
    try {
        const response = await axios.get(url, {
            timeout: 10000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        });
        const $ = cheerio.load(response.data);
        const title = $('title').text();
        const description = $('meta[name="description"]').attr('content') || '';
        const bodyText = $('body').text().slice(0, 1000); // Get first 1000 characters of body text
        return `${title}\n${description}\n${bodyText}`;
    }
    catch (error) {
        log(`Error crawling ${url}: ${error}`);
        return '';
    }
}
export async function generateEmailContent(email, userPrompt, websiteContent) {
    log(`Generating email content for ${email}`);
    const prompt = `Generate a personalized email subject and body based on the following prompt:

${userPrompt}

The email should be sent to: ${email}
Website content (if available): ${websiteContent}

Please create a unique and personalized email. Do not repeat the prompt verbatim. Format the email body with proper paragraphs and line breaks.

Please format your response as a valid JSON object with "subject" and "body" fields. Do not include any additional text or formatting outside of the JSON object. For example:
{"subject": "Your personalized subject here", "body": "Your personalized email body here\\n\\nWith proper formatting and paragraphs."}`;
    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { "role": "system", "content": "You are a helpful assistant that generates personalized email content in valid JSON format with proper formatting." },
            { "role": "user", "content": prompt }
        ],
        max_tokens: 1000
    });
    const content = completion.choices[0].message.content?.trim() || '{"subject": "Error", "body": "Error generating personalized content. Please try again."}';
    try {
        // Sanitize the content by removing any potential leading/trailing non-JSON characters
        const sanitizedContent = content.replace(/^[^{]*/, '').replace(/[^}]*$/, '');
        // Use a more robust JSON parsing method
        const parsedContent = JSON.parse(sanitizedContent);
        // Validate that the parsed content has the expected structure
        if (typeof parsedContent.subject === 'string' && typeof parsedContent.body === 'string') {
            return parsedContent;
        }
        else {
            throw new Error('Invalid content structure');
        }
    }
    catch (error) {
        log(`Error parsing AI-generated content: ${error}`);
        return { subject: 'Error', body: 'Error generating personalized content. Please try again.' };
    }
}
export async function sendEmail(to, subject, content) {
    log(`Sending email to ${to}`);
    const htmlContent = content.split('\n').map(paragraph => `<p>${paragraph}</p>`).join('');
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        text: content,
        html: htmlContent,
    };
    try {
        const info = await transporter.sendMail(mailOptions);
        log(`Email sent to ${to}: ${info.messageId}`);
        return true;
    }
    catch (error) {
        log(`Error sending email to ${to}: ${error}`);
        return false;
    }
}
export async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
//# sourceMappingURL=emailUtils.js.map