import { NextResponse } from 'next/server';
import { fetchEmails, isBusinessEmail, crawlWebsite, generateEmailContent, sendEmail } from '../../../lib/emailUtils';

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    const emails = await fetchEmails();

    let sentCount = 0;
    let failedCount = 0;

    for (const email of emails) {
      try {
        const isBusiness = isBusinessEmail(email);
        let websiteContent = '';
        if (isBusiness) {
          const domain = email.split('@')[1];
          websiteContent = await crawlWebsite(`https://${domain}`);
        }
        const { subject, body } = await generateEmailContent(email, prompt, websiteContent);
        await sendEmail(email, subject, body);
        sentCount++;
      } catch (error) {
        console.error(`Error sending email to ${email}:`, error);
        failedCount++;
      }
    }

    return NextResponse.json({ sentCount, failedCount });
  } catch (error) {
    console.error('Error in send-emails route:', error);
    if (error instanceof Error && error.message === 'No recipients found') {
      return NextResponse.json({ noRecipientsFound: true }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
