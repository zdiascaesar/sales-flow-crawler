import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface TableInfo {
  column_name: string;
  data_type: string;
  is_nullable: boolean;
  column_default: string | null;
}

function log(message: string) {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp}: ${message}`);
}

export async function getTableInfo(tableName: string): Promise<TableInfo[] | null> {
  const { data, error } = await supabase
    .rpc('get_table_info', { table_name: tableName })

  if (error) {
    log(`Error fetching table info: ${error.message}`);
    return null;
  }

  return data as TableInfo[]
}
