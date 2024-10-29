# Crawler Project

## Environment Variables

This project uses environment variables for configuration. These should be set securely in your production environment.

### Setting Up Environment Variables

1. Create a `.env` file in the root directory of the project for local development.
2. Use `.env.production` for production builds, but do not commit this file with real values.
3. Set environment variables on your production server or CI/CD pipeline.

### Required Environment Variables

```
OPENAI_API_KEY=your_openai_api_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
EMAIL_HOST=smtp.mail.ru
EMAIL_PORT=465
EMAIL_USER=your_email_here
EMAIL_PASS=your_email_password_here
```

### Handling Environment Variables in Production

1. **Never commit real API keys or passwords to version control.**
2. Use environment management tools provided by your hosting platform (e.g., Heroku Config Vars, Vercel Environment Variables).
3. For Docker deployments, pass environment variables at runtime:

   ```
   docker run -e OPENAI_API_KEY=your_key -e SUPABASE_SERVICE_ROLE_KEY=your_key ... your-image-name
   ```

4. For Kubernetes deployments, use Secrets to manage sensitive information.

### Security Best Practices

1. Rotate API keys and passwords regularly.
2. Use the principle of least privilege when assigning permissions to service accounts.
3. Monitor usage of API keys and investigate any suspicious activity.
4. Consider using a secrets management service for handling sensitive information in large-scale deployments.

## Running the Application

To run the application locally:

1. Copy `.env.example` to `.env` and fill in your development environment variables.
2. Run `npm install` to install dependencies.
3. Run `npm run dev` to start the development server.

For production deployment, ensure all environment variables are properly set in your production environment before starting the application.
