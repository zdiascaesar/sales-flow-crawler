"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const emailHandler_js_1 = require("../../../emailHandler.js");
const supabase_js_1 = require("@supabase/supabase-js");
// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey);
async function POST(request) {
    try {
        const body = await request.json();
        const { subject, message } = body;
        if (!subject || !message) {
            return server_1.NextResponse.json({ error: 'Subject and message are required' }, { status: 400 });
        }
        console.log('Fetching email data from Supabase...');
        // Fetch the emails column where emails are not null
        const { data: crawled_data, error } = await supabase
            .from('crawled_data')
            .select('emails')
            .not('emails', 'is', null);
        if (error) {
            console.error('Supabase query error:', error);
            return server_1.NextResponse.json({ error: 'Failed to fetch email data', details: error.message }, { status: 500 });
        }
        if (!crawled_data || crawled_data.length === 0) {
            console.log('No recipients found in the crawled_data table');
            return server_1.NextResponse.json({
                message: 'No recipients found in the crawled_data table',
                noRecipientsFound: true
            }, { status: 404 });
        }
        console.log('Raw crawled data:', JSON.stringify(crawled_data, null, 2));
        // Extract and flatten emails from all rows
        const allEmails = crawled_data.flatMap(item => {
            if (Array.isArray(item.emails)) {
                return item.emails;
            }
            else if (typeof item.emails === 'string') {
                return [item.emails];
            }
            else {
                console.log('Unexpected emails format:', item.emails);
                return [];
            }
        });
        console.log('All extracted emails:', allEmails);
        // Remove duplicates and ensure email validity
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const uniqueEmails = [...new Set(allEmails)].filter(email => {
            const isValid = email && typeof email === 'string' && emailRegex.test(email);
            if (!isValid) {
                console.log('Filtered out invalid email:', email);
            }
            return isValid;
        });
        console.log('Unique and valid emails:', uniqueEmails);
        if (uniqueEmails.length === 0) {
            console.log('No valid recipients found after filtering');
            return server_1.NextResponse.json({
                message: 'No valid recipients found in the crawled_data table',
                noRecipientsFound: true
            }, { status: 404 });
        }
        console.log(`Processing email queue for ${uniqueEmails.length} recipients...`);
        // Process the email queue by sending the extracted emails
        const result = await (0, emailHandler_js_1.processEmailQueue)(subject, message, uniqueEmails);
        console.log('Email sending process completed:', result);
        return server_1.NextResponse.json({
            message: 'Email sending process completed',
            sentCount: result.sentCount,
            failedCount: result.failedCount,
            failedRecipients: result.failedRecipients
        });
    }
    catch (error) {
        console.error('Unexpected error in send-emails route:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return server_1.NextResponse.json({ error: 'Failed to process email queue', details: errorMessage }, { status: 500 });
    }
}
//# sourceMappingURL=route.js.map