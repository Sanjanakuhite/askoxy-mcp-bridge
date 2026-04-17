# Use Node.js 20 LTS Alpine (supports npm 10+)
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Update npm to latest stable version compatible with Node 20
RUN npm install -g npm@10 --legacy-peer-deps

# Install dependencies first (for better caching)
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

# Copy source code
COPY . .

# Copy health check script and make it executable
COPY healthcheck.sh /app/healthcheck.sh
RUN chmod +x /app/healthcheck.sh

# Create logs directory
RUN mkdir -p logs

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership of app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD /app/healthcheck.sh

# Start the application (run Node directly, Render manages the process)
CMD ["node", "server.js"]