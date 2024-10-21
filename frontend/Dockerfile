# Build stage
FROM node:18-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the frontend code
COPY . .

# Create public directory if it doesn't exist
RUN mkdir -p public

# Build the Next.js application
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

# Install Chrome
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Tell Puppeteer to use the installed Chrome instead of downloading its own
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

# Copy necessary files from the build stage
COPY --from=builder /app/package.json ./
COPY --from=builder /app/.next ./.next/
COPY --from=builder /app/public ./public/
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/node_modules ./node_modules/
COPY --from=builder /app/crawler-config.json ./

# Set environment variables
ENV NODE_ENV=production

# Use the $PORT environment variable provided by Heroku
CMD ["sh", "-c", "npm start -- -p ${PORT:-3000}"]
