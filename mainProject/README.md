# Crawler Project

## Environment Variables

This project uses environment variables for configuration. These should be set securely in your production environment.

### Environment Files

The project uses the following environment files:

1. `.env`: Used for local development.
2. `.env.local`: Used for local overrides (not committed to version control).
3. `.env.production`: Used for production settings.

### Setting Up Environment Variables

1. For local development, copy `.env.production` to `.env` and adjust the values as needed.
2. For production, ensure `.env.production` is properly configured.

### Required Environment Variables

Your environment files should contain the following variables:

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
3. For Docker deployments, see the Docker section below for handling environment variables.
4. For Kubernetes deployments, use Secrets to manage sensitive information.

### Security Best Practices

1. Rotate API keys and passwords regularly.
2. Use the principle of least privilege when assigning permissions to service accounts.
3. Monitor usage of API keys and investigate any suspicious activity.
4. Consider using a secrets management service for handling sensitive information in large-scale deployments.

## Recent Changes

We've made significant changes to the crawler implementation:

1. Removed Puppeteer dependency: The project no longer uses Puppeteer for web crawling. This change makes the application more lightweight and compatible with serverless environments.
2. Switched to Cheerio: We now use Cheerio for HTML parsing, which is more efficient for our use case and doesn't require a browser environment.
3. Updated crawler logic: The crawler now uses `fetch` for making HTTP requests instead of Puppeteer's page navigation.
4. Improved error handling and logging: We've enhanced error handling throughout the application and improved logging for better debugging.

These changes make the application more efficient, easier to deploy, and compatible with a wider range of hosting environments, including serverless platforms.

## Running the Application

To run the application locally:

1. Ensure your `.env` file is set up with the correct variables in the mainProject directory.
2. Run `npm install` to install dependencies.
3. Run `npm run dev` to start the development server.

For production deployment, ensure all environment variables are properly set in your production environment before starting the application.

## Deployment

### Using Docker

This project includes a Dockerfile for easy deployment. Follow these steps to deploy using Docker:

1. Ensure the `.env.production` file is present and properly configured in the mainProject directory.

2. Build the Docker image:
   ```
   docker build -t mainproject .
   ```
   Note: The build process will use `.env.production` if `.env` is not present.

3. Run the Docker container:
   ```
   docker run -p 3000:3000 mainproject
   ```
   If you want to use a different env file, you can mount it:
   ```
   docker run -p 3000:3000 -v $(pwd)/.env:/app/.env mainproject
   ```

4. Access the application at `http://localhost:3000`

### Docker Best Practices

- Always use the latest security updates for your base image.
- Use multi-stage builds to keep your final image size small.
- Don't run containers as root. The Dockerfile uses a non-root user for better security.
- Use `.dockerignore` to prevent unnecessary files from being included in your image.
- Regularly update your dependencies and rebuild your Docker image.

Remember to always use HTTPS in production and configure any necessary security measures like firewalls and access controls.

## Continuous Integration/Continuous Deployment (CI/CD)

Consider setting up a CI/CD pipeline using tools like GitHub Actions, GitLab CI, or Jenkins to automate the testing and deployment process.

For any issues or questions, please open an issue in the GitHub repository.
