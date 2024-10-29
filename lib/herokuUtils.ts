/**
 * Utility functions for interacting with the Heroku API
 */

interface HerokuRequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  body?: Record<string, unknown>;
}

/**
 * Makes an authenticated request to the Heroku API with the correct version header
 * @param config Request configuration
 * @returns Promise with the API response
 */
export async function makeHerokuApiRequest(config: HerokuRequestConfig) {
  const { method, path, body } = config;
  const apiToken = process.env.API_TOKEN;

  if (!apiToken) {
    throw new Error('API_TOKEN environment variable is not set');
  }

  const headers = {
    'Accept': 'application/vnd.heroku+json; version=3',
    'Authorization': `Bearer ${apiToken}`,
    'Content-Type': 'application/json'
  };

  const response = await fetch(`https://api.heroku.com${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    throw new Error(`Heroku API request failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Example usage:
 * 
 * // Get app info
 * const appInfo = await makeHerokuApiRequest({
 *   method: 'GET',
 *   path: '/apps/your-app-name'
 * });
 * 
 * // Restart dyno
 * await makeHerokuApiRequest({
 *   method: 'POST',
 *   path: '/apps/your-app-name/dynos',
 *   body: {
 *     type: 'web'
 *   }
 * });
 */
