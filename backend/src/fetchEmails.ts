import { supabase } from './config';

console.log('Script started');

async function fetchEmailsFromDB(): Promise<string[]> {
  console.log('Attempting to fetch emails...');
  try {
    const { data, error } = await supabase
      .from('emails')
      .select('email');

    if (error) {
      console.error('Supabase query error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return [];
    }

    if (data && data.length > 0) {
      console.log('Fetched emails:');
      data.forEach((row: { email: string }) => console.log(row.email));
      console.log(`Total emails fetched: ${data.length}`);
      return data.map((row: { email: string }) => row.email);
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

async function main(): Promise<void> {
  try {
    await fetchEmailsFromDB();
    console.log('Script execution completed.');
  } catch (error) {
    if (error instanceof Error) {
      console.error('Unhandled error:', error.message);
    } else {
      console.error('Unhandled error:', error);
    }
  }
}

export { fetchEmailsFromDB, main };
