# Use Node.js 20 with a specific tag for better reproducibility
FROM node:20.9.0 AS builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the entire project
COPY . .

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM node:20.9.0 AS runner

# Set working directory
WORKDIR /app

# Create a non-root user
RUN groupadd -g 1001 nodejs && useradd -m -u 1001 -g nodejs nextjs

# Copy package.json and package-lock.json
COPY --from=builder /app/package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/next.config.js ./
COPY --from=builder --chown=nextjs:nodejs /app/next.config.mjs ./
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./

# Copy additional directories and files needed for the application to run
COPY --from=builder --chown=nextjs:nodejs /app/lib ./lib
COPY --from=builder --chown=nextjs:nodejs /app/components ./components
COPY --from=builder --chown=nextjs:nodejs /app/app ./app
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/src ./src
COPY --from=builder --chown=nextjs:nodejs /app/crawler-config.json ./
COPY --from=builder --chown=nextjs:nodejs /app/emailHandler.js ./
COPY --from=builder --chown=nextjs:nodejs /app/emailHandler.d.ts ./
COPY --from=builder --chown=nextjs:nodejs /app/middleware.ts ./

# Expose the port the app runs on
EXPOSE 3000

# Set file permissions for the entire working directory
RUN chown -R nextjs:nodejs /app
RUN chmod -R 755 /app

# Create the log file with appropriate permissions
RUN touch /app/queue_manager_log.txt && chown nextjs:nodejs /app/queue_manager_log.txt

# Switch to non-root user
USER nextjs

# Add health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:${PORT}', (res) => res.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Run the application
CMD ["sh", "-c", "npm start -- -p ${PORT}"]