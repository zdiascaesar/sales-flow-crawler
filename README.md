<<<<<<< HEAD
<<<<<<< HEAD
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
=======
# crawler
>>>>>>> 01cc738c0941535e4e3aa149675737a077aafa69
=======
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
>>>>>>> heroku/main
