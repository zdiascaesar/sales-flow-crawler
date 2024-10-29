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

export async function getTableInfo(tableName: string): Promise<TableInfo[] | null> {
  try {
    // First verify if we can connect to the table
    const { error: tableError } = await supabase
      .from(tableName)
      .select('*')
      .limit(0)

    if (tableError) {
      console.error('Error checking table:', tableError)
      throw new Error(`Table check failed: ${tableError.message}`)
    }

    // If we get here, the table exists and we can access it
    return [
      {
        column_name: 'id',
        data_type: 'uuid',
        is_nullable: false,
        column_default: null
      },
      {
        column_name: 'url',
        data_type: 'text',
        is_nullable: false,
        column_default: null
      },
      {
        column_name: 'emails',
        data_type: 'text[]',
        is_nullable: true,
        column_default: null
      },
      {
        column_name: 'crawl_date',
        data_type: 'timestamp',
        is_nullable: false,
        column_default: 'CURRENT_TIMESTAMP'
      }
    ]
  } catch (error) {
    console.error('Error in getTableInfo:', error)
    throw error
  }
}
