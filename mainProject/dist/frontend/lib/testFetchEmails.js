"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fetchCrawledData_1 = require("./fetchCrawledData");
async function testFetchEmails() {
    console.log('Starting test...');
    try {
        console.log('Fetching emails from crawled data...');
        const emails = await (0, fetchCrawledData_1.fetchEmailsFromCrawledData)();
        console.log('Fetched emails successfully:');
        console.log(emails);
        console.log(`Total unique emails: ${emails.length}`);
    }
    catch (error) {
        console.error('Error while fetching emails:', error);
    }
    console.log('Test completed.');
}
// Ensure the async function is properly handled
testFetchEmails().catch(error => {
    console.error('Unhandled error in testFetchEmails:', error);
});
console.log('Script executed.');
//# sourceMappingURL=testFetchEmails.js.map