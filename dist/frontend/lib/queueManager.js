import { createClient } from '@supabase/supabase-js';
export class QueueManager {
    constructor() {
        this.queue = [];
        this.isProcessing = false;
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl || !supabaseServiceRoleKey) {
            throw new Error('Supabase URL or service role key is missing from environment variables');
        }
        this.supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
        console.log('Supabase client initialized');
    }
    async addToQueue(pageInfo) {
        this.queue.push(pageInfo);
        console.log(`Added to queue: ${pageInfo.url}`);
        if (!this.isProcessing) {
            this.processQueue();
        }
    }
    async processQueue() {
        if (this.isProcessing)
            return;
        this.isProcessing = true;
        console.log('Started processing queue');
        while (this.queue.length > 0) {
            const pageInfo = this.queue.shift();
            if (pageInfo) {
                try {
                    await this.storePageInfo(pageInfo);
                    console.log(`Successfully stored data for ${pageInfo.url}`);
                }
                catch (error) {
                    console.error(`Failed to store data for ${pageInfo.url}:`, error);
                    // Put the item back in the queue to retry later
                    this.queue.unshift(pageInfo);
                    // Wait for a bit before retrying
                    await new Promise(resolve => setTimeout(resolve, 5000));
                }
            }
        }
        this.isProcessing = false;
        console.log('Finished processing queue');
    }
    async storePageInfo(pageInfo) {
        console.log(`Attempting to store data for ${pageInfo.url}`);
        // First, check if the URL already exists
        const { data, error: selectError } = await this.supabase
            .from('crawled_data')
            .select('id')
            .eq('url', pageInfo.url)
            .single();
        if (selectError) {
            if (selectError.code === 'PGRST116') {
                console.log(`No existing record found for ${pageInfo.url}`);
            }
            else {
                console.error(`Error checking for existing record: ${selectError.message}`);
                throw selectError;
            }
        }
        if (data) {
            console.log(`Updating existing record for ${pageInfo.url}`);
            // If the URL exists, update the existing record
            const { error: updateError } = await this.supabase
                .from('crawled_data')
                .update(pageInfo)
                .eq('id', data.id);
            if (updateError) {
                console.error(`Error updating record: ${updateError.message}`);
                throw updateError;
            }
            console.log(`Successfully updated record for ${pageInfo.url}`);
        }
        else {
            console.log(`Inserting new record for ${pageInfo.url}`);
            // If the URL doesn't exist, insert a new record
            const { error: insertError } = await this.supabase
                .from('crawled_data')
                .insert(pageInfo);
            if (insertError) {
                console.error(`Error inserting record: ${insertError.message}`);
                throw insertError;
            }
            console.log(`Successfully inserted new record for ${pageInfo.url}`);
        }
    }
}
export const queueManager = new QueueManager();
//# sourceMappingURL=queueManager.js.map