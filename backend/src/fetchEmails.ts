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

export async function fetchEmails() {
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
      return data.map(row => row.email);
    } else {
      console.log('No emails found in the table or no permission to read.');
      return [];
    }
  } catch (error) {
    console.error('Error fetching emails:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      if ('details' in error) {
        console.error('Error details:', (error as any).details);
      }
    }
    return [];
  }
}

export async function main() {
  try {
    await fetchEmails();
    console.log('Script execution completed.');
  } catch (error) {
    if (error instanceof Error) {
      console.error('Unhandled error:', error.message);
    } else {
      console.error('Unhandled error:', error);
    }
  }
}
