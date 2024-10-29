"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchEmailsFromCrawledData = fetchEmailsFromCrawledData;
exports.fetchCrawledData = fetchCrawledData;
const supabase_1 = require("./supabase");
async function fetchEmailsFromCrawledData() {
    try {
        const { data, error } = await supabase_1.supabase
            .from('crawled_data')
            .select('emails')
            .not('emails', 'is', null);
        if (error) {
            throw error;
        }
        if (!data || data.length === 0) {
            return [];
        }
        // Extract and flatten emails from all rows
        const allEmails = data.flatMap(item => {
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
        // Remove duplicates and ensure email validity
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const uniqueEmails = [...new Set(allEmails)].filter(email => {
            const isValid = email && typeof email === 'string' && emailRegex.test(email);
            if (!isValid) {
                console.log('Filtered out invalid email:', email);
            }
            return isValid;
        });
        return uniqueEmails;
    }
    catch (error) {
        console.error('Error fetching emails from crawled data:', error);
        throw error;
    }
}
// Keep the original function for backwards compatibility
async function fetchCrawledData() {
    try {
        const { data, error } = await supabase_1.supabase
            .from('crawled_data')
            .select('*')
            .csv();
        if (error) {
            throw error;
        }
        return data;
    }
    catch (error) {
        console.error('Error fetching crawled data:', error);
        throw error;
    }
}
//# sourceMappingURL=fetchCrawledData.js.map