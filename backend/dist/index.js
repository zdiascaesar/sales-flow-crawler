"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fetchEmails_1 = require("./fetchEmails");
const sendEmails_1 = require("./sendEmails");
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
// Middleware
app.use(express_1.default.json());
// Routes
app.get('/', (req, res) => {
    res.send('Backend server is running');
});
// Combined function to process email queue
function processEmailQueue() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Processing email queue...');
        try {
            yield (0, fetchEmails_1.fetchEmailsFromDB)();
            yield (0, sendEmails_1.main)();
        }
        catch (error) {
            console.error('Error processing email queue:', error);
        }
    });
}
// Email processing function
const startEmailProcessing = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (intervalMinutes = 5) {
    console.log('Starting email processing...');
    setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
        yield processEmailQueue();
    }), intervalMinutes * 60 * 1000);
});
// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    // Start the email processing in the background
    startEmailProcessing();
});
exports.default = app; // Export the app for testing or further use
