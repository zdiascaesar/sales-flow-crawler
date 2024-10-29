"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
const fetchCrawledData_1 = require("./fetchCrawledData");
// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
async function testFetchCrawledData() {
    console.log('Starting test...');
    try {
        console.log('Fetching crawled data...');
        const csvData = await (0, fetchCrawledData_1.fetchCrawledData)();
        console.log('Fetched data successfully:');
        console.log(csvData);
    }
    catch (error) {
        console.error('Error while fetching crawled data:', error);
    }
    console.log('Test completed.');
}
// Ensure the async function is properly handled
testFetchCrawledData().catch(error => {
    console.error('Unhandled error in testFetchCrawledData:', error);
});
console.log('Script executed.');
//# sourceMappingURL=testFetchCrawledData.js.map