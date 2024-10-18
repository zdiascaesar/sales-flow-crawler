"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
exports.getTableInfo = getTableInfo;
const supabase_js_1 = require("@supabase/supabase-js");
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey);
async function getTableInfo(tableName) {
    const { data, error } = await exports.supabase
        .rpc('get_table_info', { table_name: tableName });
    if (error) {
        console.error('Error fetching table info:', error);
        return null;
    }
    return data;
}
//# sourceMappingURL=supabase.js.map