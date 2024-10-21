import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Configure email transporter with timeout
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: true, // Use SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  connectionTimeout: 10000  // Set a connection timeout (10 seconds)
});

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function sendEmail(to, subject, text, html) {
  console.log('Attempting to send email to:', to);  // Log the recipient email

  if (!to || !subject || (!text && !html)) {
    console.error('Invalid email parameters:', { to, subject, textProvided: !!text, htmlProvided: !!html });
    throw new Error('Invalid email parameters');
  }

  if (!emailRegex.test(to)) {
    console.error('Invalid email address:', to);
    throw new Error('Invalid email address');
  }

  try {
    let info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text: text || 'No plain text content available',  // Fallback text
      html
    });
    console.log('Message sent: %s', info.messageId);
    return { success: true, message: 'Email sent successfully', info };
  } catch (error) {
    console.error('Error sending email:', error.message);
    return { success: false, message: 'Failed to send email', error: error.message };
  }
}

export async function processEmailQueue(subject, message, recipients) {
  console.log('Starting processEmailQueue...');
  console.log('Total recipients:', recipients.length);
  
  let sentCount = 0;
  let failedCount = 0;
  const failedRecipients = [];

  // Filter and validate email addresses
  const validRecipients = recipients.filter(email => {
    if (emailRegex.test(email)) {
      return true;
    } else {
      console.log('Filtered out invalid email:', email);
      return false;
    }
  });

  console.log('Valid recipients after filtering:', validRecipients.length);

  const batchSize = 10; // Adjust based on your needs and rate limits
  for (let i = 0; i < validRecipients.length; i += batchSize) {
    const batch = validRecipients.slice(i, i + batchSize);
    console.log(`Processing batch ${i / batchSize + 1}, size: ${batch.length}`);

    const results = await Promise.allSettled(batch.map(recipient => 
      sendEmail(recipient, subject, message, `<p>${message}</p>`)
    ));

    results.forEach((result, index) => {
      const recipient = batch[index];
      if (result.status === 'fulfilled' && result.value.success) {
        sentCount++;
        console.log(`Successfully sent email to: ${recipient}`);
      } else {
        failedCount++;
        failedRecipients.push(recipient);
        const errorMessage = result.status === 'rejected' ? result.reason : result.value.message;
        console.error(`Failed to send email to: ${recipient} - Reason: ${errorMessage}`);
      }
    });

    // Add a small delay between batches to avoid overwhelming the email server
    if (i + batchSize < validRecipients.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(`Email sending completed. Sent: ${sentCount}, Failed: ${failedCount}`);

  return { 
    sentCount, 
    failedCount, 
    failedRecipients, 
    noRecipientsFound: sentCount === 0 && failedCount === 0 
  };
}

// Function to validate environment variables
function validateEnvVariables() {
  const requiredVars = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  console.log('All required environment variables are set.');
}

// Call this function when the module is loaded
validateEnvVariables();

// Test the email configuration
transporter.verify(function (error) {
  if (error) {
    console.error('Email transporter verification failed:', error);
  } else {
    console.log('Email transporter is ready to send messages');
  }
});
