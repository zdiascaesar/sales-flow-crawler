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
exports.GET = GET;
exports.POST = POST;
const server_1 = require("next/server");
const emailInfoCrawler_1 = require("../../../lib/emailInfoCrawler");
const supabase_1 = require("../../../lib/supabase");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let crawler = null;
async function GET() {
    try {
        // Log the crawled_data table schema
        const tableInfo = await (0, supabase_1.getTableInfo)('crawled_data');
        console.log('crawled_data table schema:', tableInfo);
        return server_1.NextResponse.json({ message: 'GET request received', tableInfo });
    }
    catch (error) {
        console.error('GET error:', error);
        return server_1.NextResponse.json({ error: error.message }, { status: 500 });
    }
}
async function POST(request) {
    try {
        const body = await request.json();
        const { action, startUrl, maxPages, concurrency } = body;
        const configPath = path.join(process.cwd(), 'crawler-config.json');
        if (!fs.existsSync(configPath)) {
            throw new Error(`Configuration file not found: ${configPath}`);
        }
        switch (action) {
            case 'status':
                return server_1.NextResponse.json({ isRunning: crawler !== null && crawler.isRunning() });
            case 'start':
                if (crawler && crawler.isRunning()) {
                    return server_1.NextResponse.json({ error: 'Crawler is already running' }, { status: 400 });
                }
                if (!startUrl) {
                    return server_1.NextResponse.json({ error: 'Start URL is required' }, { status: 400 });
                }
                crawler = new emailInfoCrawler_1.EmailInfoCrawler(configPath);
                crawler.on('log', (message) => {
                    console.log(message);
                });
                crawler.on('result', (result) => {
                    console.log('Crawl result:', result);
                });
                // Start the crawl process with the provided startUrl, maxPages, and concurrency
                crawler.crawl(startUrl, maxPages, concurrency).then(() => {
                    console.log('Crawl completed');
                    crawler = null;
                }).catch((error) => {
                    console.error('Crawl error:', error);
                    crawler = null;
                });
                return server_1.NextResponse.json({ message: 'Crawler started' });
            case 'stop':
                if (crawler && crawler.isRunning()) {
                    crawler.stop();
                    return server_1.NextResponse.json({ message: 'Crawler stopping' });
                }
                else {
                    return server_1.NextResponse.json({ error: 'No crawler is currently running' }, { status: 400 });
                }
            default:
                return server_1.NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
    }
    catch (error) {
        console.error('POST error:', error);
        return server_1.NextResponse.json({ error: error.message }, { status: 500 });
    }
}
//# sourceMappingURL=route.js.map