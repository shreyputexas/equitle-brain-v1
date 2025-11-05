# Use Node.js 18 LTS
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy TypeScript config for server
COPY server/tsconfig.json ./server/
COPY tsconfig.json ./

# Copy source code
COPY server ./server

# Install all dependencies including dev dependencies for building
RUN npm install

# Build the server
RUN npm run build:server

# Remove dev dependencies to reduce image size
RUN npm ci --only=production && npm cache clean --force

# Create uploads directory
RUN mkdir -p uploads

# Copy Firebase service account if exists
COPY firebase-service-account.json ./firebase-service-account.json 2>/dev/null || true

# Expose port
EXPOSE 10000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:10000/health || exit 1

# Start the application
CMD ["npm", "run", "start:production"]