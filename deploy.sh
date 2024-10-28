#!/bin/bash

# Enhanced deployment script with alternative methods and debugging
set -e  # Exit on error

echo "Starting enhanced deployment process..."

# 1. Clean up and logout first
echo "Cleaning up previous sessions..."
heroku container:logout || true
docker logout registry.heroku.com || true
docker system prune -f || true

# 2. Fresh login to Heroku
echo "Performing fresh Heroku login..."
heroku login

# 3. Login to container registry
echo "Logging into Heroku container registry..."
heroku container:login

# 4. Verify Heroku app exists
echo "Verifying Heroku app..."
heroku apps:info -a crawler-dev || {
    echo "Error: Could not find app crawler-dev"
    exit 1
}

# 5. Build and push directly using Heroku container commands
echo "Building and pushing with Heroku container commands..."
heroku container:push web --app crawler-dev

# 6. Release the container
echo "Releasing the container..."
heroku container:release web --app crawler-dev

# 7. Scale the dyno to ensure it's running
echo "Scaling the dyno..."
heroku ps:scale web=1 --app crawler-dev

# 8. Show logs for debugging
echo "Showing recent logs..."
heroku logs --tail --app crawler-dev

echo "Deployment process completed"
