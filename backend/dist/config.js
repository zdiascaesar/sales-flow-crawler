"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabaseKey = exports.supabaseUrl = exports.supabase = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const supabase_js_1 = require("@supabase/supabase-js");
dotenv_1.default.config();
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
exports.supabaseUrl = supabaseUrl;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
exports.supabaseKey = supabaseKey;
if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration');
}
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
