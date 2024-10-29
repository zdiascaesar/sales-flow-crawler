import { NextResponse } from 'next/server';
import { fetchEmails } from '../../../lib/emailUtils';
import { queueManager } from '../../../lib/queueManager';
import * as fs from 'fs';

function log(message: string) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp}: ${message}\n`;
  fs.appendFileSync('send_emails_log.txt', logMessage);
}

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    const emails = await fetchEmails();

    if (emails.length === 0) {
      return NextResponse.json({ noRecipientsFound: true }, { status: 404 });
    }

    const jobId = await queueManager.addEmailProcessingJob(emails, prompt);

    log(`Queued email processing job with ID: ${jobId} for ${emails.length} emails`);
    return NextResponse.json({ jobId, message: 'Email processing job queued successfully', emailCount: emails.length });
  } catch (error) {
    log(`Error in send-emails route: ${(error as Error).message}`);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
  }

  const jobStatus = queueManager.getJobStatus(jobId);

  if (!jobStatus) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  return NextResponse.json(jobStatus);
}
