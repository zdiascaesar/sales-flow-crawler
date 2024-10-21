# Stage 1: Build frontend
FROM node:18 AS frontend-builder
WORKDIR /usr/src/app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend .

# Add these lines to pass environment variables during build
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG SUPABASE_SERVICE_ROLE_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY

RUN npm run build

# Stage 2: Build backend
FROM node:18 AS backend-builder
WORKDIR /usr/src/app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend .

# Stage 3: Final image
FROM node:18
WORKDIR /usr/src/app

# Install dependencies required for Puppeteer
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
    --no-install-recommends \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables for Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
ENV PUPPETEER_EXECUTABLE_PATH /usr/bin/chromium

# Copy backend
COPY --from=backend-builder /usr/src/app/backend ./backend

# Copy frontend build
COPY --from=frontend-builder /usr/src/app/frontend/.next ./frontend/.next
COPY --from=frontend-builder /usr/src/app/frontend/public ./frontend/public
COPY --from=frontend-builder /usr/src/app/frontend/package*.json ./frontend/

# Install production dependencies for frontend
WORKDIR /usr/src/app/frontend
RUN npm install --only=production

# Set working directory back to root
WORKDIR /usr/src/app

# Copy necessary files for running the app
COPY package*.json ./
RUN npm install --only=production

# Expose the port the app runs on
EXPOSE 3000

# Define the command to run the app, using the PORT environment variable
CMD ["sh", "-c", "npm start -- -p $PORT"]
