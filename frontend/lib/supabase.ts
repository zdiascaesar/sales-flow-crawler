import { initializeSupabaseClient } from './supabaseClient'

export const supabase = initializeSupabaseClient()

interface TableInfo {
  column_name: string;
  data_type: string;
  is_nullable: boolean;
  column_default: string | null;
}

export async function getTableInfo(tableName: string): Promise<TableInfo[] | null> {
  try {
    const { data, error } = await supabase
      .rpc('get_table_info', { table_name: tableName })

    if (error) {
      throw error
    }

    return data as TableInfo[]
  } catch (error) {
    console.error('Error fetching table info:', error)
    return null
  }
}
