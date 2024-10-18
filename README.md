# Email Crawler Project

## Supabase Configuration

To resolve the "new row violates row-level security policy for table 'crawled_data'" error, follow these steps to update the Row Level Security (RLS) policies in Supabase:

1. Log into your Supabase dashboard.
2. Navigate to the 'crawled_data' table in your project.
3. Go to the "Authentication" tab.
4. Create or update an RLS policy with the following SQL:

```sql
CREATE POLICY "Allow service role to insert data"
ON public.crawled_data
FOR INSERT
TO service_role
USING (true);
```

This policy will allow the service role to insert data into the 'crawled_data' table.

## Environment Variables

Ensure that your `.env.local` file contains the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

Replace `your_supabase_url`, `your_supabase_anon_key`, and `your_supabase_service_role_key` with your actual Supabase project details.

## Running the Crawler

After updating the RLS policies and environment variables, you should be able to run the crawler without encountering the row-level security error.

If you continue to experience issues, please check the console logs for any error messages and ensure that all environment variables are correctly set.
