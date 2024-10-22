import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PageInfo } from './types';
import * as fs from 'fs';

function log(message: string) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp}: ${message}\n`;
  fs.appendFileSync('queue_manager_log.txt', logMessage);
}

export class QueueManager {
  private queue: PageInfo[] = [];
  private supabase: SupabaseClient;
  private isProcessing = false;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Supabase URL or service role key is missing from environment variables');
    }

    this.supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    log('Supabase client initialized');
  }

  async addToQueue(pageInfo: PageInfo): Promise<void> {
    this.queue.push(pageInfo);
    log(`Added to queue: ${pageInfo.url}`);
    if (!this.isProcessing) {
      await this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;
    log('Started processing queue');

    while (this.queue.length > 0) {
      const pageInfo = this.queue.shift();
      if (pageInfo) {
        try {
          await this.storePageInfo(pageInfo);
          log(`Successfully stored data for ${pageInfo.url}`);
        } catch (error) {
          log(`Failed to store data for ${pageInfo.url}: ${error}`);
          // Put the item back in the queue to retry later
          this.queue.unshift(pageInfo);
          // Wait for a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    }

    this.isProcessing = false;
    log('Finished processing queue');
  }

  private async storePageInfo(pageInfo: PageInfo): Promise<void> {
    log(`Attempting to store data for ${pageInfo.url}`);
    
    // First, check if the URL already exists
    const { data, error: selectError } = await this.supabase
      .from('crawled_data')
      .select('id')
      .eq('url', pageInfo.url)
      .single();

    if (selectError) {
      if (selectError.code === 'PGRST116') {
        log(`No existing record found for ${pageInfo.url}`);
      } else {
        log(`Error checking for existing record: ${selectError.message}`);
        throw selectError;
      }
    }

    if (data) {
      log(`Updating existing record for ${pageInfo.url}`);
      // If the URL exists, update the existing record
      const { error: updateError } = await this.supabase
        .from('crawled_data')
        .update(pageInfo)
        .eq('id', data.id);

      if (updateError) {
        log(`Error updating record: ${updateError.message}`);
        throw updateError;
      }
      log(`Successfully updated record for ${pageInfo.url}`);
    } else {
      log(`Inserting new record for ${pageInfo.url}`);
      // If the URL doesn't exist, insert a new record
      const { error: insertError } = await this.supabase
        .from('crawled_data')
        .insert(pageInfo);

      if (insertError) {
        log(`Error inserting record: ${insertError.message}`);
        throw insertError;
      }
      log(`Successfully inserted new record for ${pageInfo.url}`);
    }
  }
}

export const queueManager = new QueueManager();
