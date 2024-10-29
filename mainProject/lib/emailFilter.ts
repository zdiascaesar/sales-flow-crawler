import { SupabaseClient, PageInfo } from './types';
import * as fs from 'fs';

function log(message: string) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp}: ${message}\n`;
  fs.appendFileSync('email_filter_log.txt', logMessage);
}

export class EmailFilter {
  private supabase: SupabaseClient;
  private crawledEmails: Set<string>;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.crawledEmails = new Set();
  }

  async filterNewEmails(emails: string[]): Promise<string[]> {
    try {
      const { data: crawledData, error: crawledError } = await this.supabase
        .from('crawled_data')
        .select('emails');

      if (crawledError) throw crawledError;

      const { data: emailsData, error: emailsError } = await this.supabase
        .from('emails')
        .select('email')
        .in('email', emails);

      if (emailsError) throw emailsError;

      const allExistingEmails = new Set([
        ...(crawledData?.flatMap(row => (row as PageInfo).emails) || []),
        ...(emailsData?.map(row => row.email as string) || [])
      ]);

      const newEmails = emails.filter(email => !allExistingEmails.has(email) && !this.crawledEmails.has(email));

      newEmails.forEach(email => this.crawledEmails.add(email));

      return newEmails;
    } catch (error) {
      log(`Error filtering new emails: ${(error as Error).message}`);
      return emails;
    }
  }

  async insertUniqueEmails(emails: string[]): Promise<void> {
    try {
      // First, get all existing emails
      const { data: existingEmails, error: selectError } = await this.supabase
        .from('emails')
        .select('email')
        .in('email', emails);

      if (selectError) throw selectError;

      // Filter out emails that already exist
      const newEmails = emails.filter(email => !existingEmails?.some(e => e.email === email));

      if (newEmails.length === 0) {
        log('No new emails to insert');
        return;
      }

      // Insert only the new emails
      const { error } = await this.supabase
        .from('emails')
        .insert(newEmails.map(email => ({ email })));

      if (error) throw error;

      log(`Inserted ${newEmails.length} unique emails into the emails table`);
    } catch (error) {
      log(`Error inserting unique emails: ${(error as Error).message}`);
    }
  }
}
