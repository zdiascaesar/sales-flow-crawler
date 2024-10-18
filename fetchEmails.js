import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

console.log('Script started');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseKey ? '[REDACTED]' : 'Not set');

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or API Key is missing. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchEmails() {
  console.log('Attempting to fetch emails...');
  try {
    const { data, error } = await supabase
      .from('emails')
      .select('email');

    if (error) {
      console.error('Supabase query error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return;
    }

    if (data && data.length > 0) {
      console.log('Fetched emails:');
      data.forEach(row => console.log(row.email));
      console.log(`Total emails fetched: ${data.length}`);
    } else {
      console.log('No emails found in the table or no permission to read.');
    }
  } catch (error) {
    console.error('Error fetching emails:', error);
    if (error.message) console.error('Error message:', error.message);
    if (error.details) console.error('Error details:', error.details);
  }
}

async function main() {
  await fetchEmails();
  console.log('Script execution completed.');
}

main().catch(error => console.error('Unhandled error:', error));
